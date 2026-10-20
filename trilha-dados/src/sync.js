import { useCallback, useEffect, useRef, useState } from 'react'
import { gravar, ler } from './storage'

// Estado do aluno: aulas concluídas, anotações e última aula aberta.
// Sempre guardado no localStorage; quando a página roda como Artifact do claude.ai
// com uma conta logada, também fica num documento privado da conta (db) e
// sincroniza entre dispositivos.
const VAZIO = { concluidas: {}, anotacoes: {}, ultima: null }

function estadoLocal() {
  const salvo = ler('estado', null)
  if (salvo) return { ...VAZIO, ...salvo }
  // Formato antigo: uma chave por campo.
  return { concluidas: ler('concluidas', {}), anotacoes: ler('anotacoes', {}), ultima: ler('ultima-aula', null) }
}

export function useProgresso() {
  const [estado, setEstado] = useState(estadoLocal)
  const [nuvem, setNuvem] = useState('local') // local | conectando | sincronizado | erro
  const ref = useRef(estado)
  const docRef = useRef(null)
  const servidor = useRef(null) // último JSON confirmado pelo servidor
  const timer = useRef(null)
  const gravando = useRef(false)

  const pendente = () => gravando.current || timer.current !== null

  const enviar = useCallback(async () => {
    clearTimeout(timer.current)
    timer.current = null
    const doc = docRef.current
    const json = JSON.stringify(ref.current)
    if (!doc || gravando.current || json === servidor.current) return
    gravando.current = true
    try {
      await doc.set(JSON.parse(json))
      servidor.current = json
      setNuvem('sincronizado')
    } catch {
      setNuvem('erro')
    } finally {
      gravando.current = false
    }
    // Algo mudou durante a gravação: envia de novo (uma gravação por vez).
    if (JSON.stringify(ref.current) !== servidor.current) timer.current = setTimeout(enviar, 400)
  }, [])

  // Grava no localStorage na hora (pode ser ao fechar a aba) e agenda o envio à nuvem.
  const atualizar = useCallback(
    (fn) => {
      const novo = fn(ref.current)
      if (novo === ref.current) return
      ref.current = novo
      gravar('estado', novo)
      setEstado(novo)
      clearTimeout(timer.current)
      timer.current = setTimeout(enviar, 400)
    },
    [enviar],
  )

  useEffect(() => {
    if (!window.claude?.use) return
    let vivo = true
    let cancelar = () => {}
    setNuvem('conectando')

    ;(async () => {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')])
      const id = await user?.id()
      if (!vivo) return
      if (!db || !id) return setNuvem('local')
      const doc = db.doc(`data/users/${id}/progresso`)
      cancelar = doc.onSnapshot(
        (snap) => {
          if (snap.metadata.hasPendingWrites) return
          const primeiro = docRef.current === null
          docRef.current = doc
          if (!snap.exists) {
            // Primeiro acesso nesta conta: sobe o que já existe neste navegador.
            servidor.current = JSON.stringify(VAZIO)
            enviar()
          } else if (primeiro) {
            // Ao conectar, junta o que há na conta com o que há neste navegador,
            // para um dispositivo novo (vazio) nunca apagar o progresso salvo.
            const remoto = { ...VAZIO, ...snap.data() }
            servidor.current = JSON.stringify(remoto)
            const local = ref.current
            const anotacoes = { ...remoto.anotacoes }
            for (const [k, v] of Object.entries(local.anotacoes)) if (v && !anotacoes[k]) anotacoes[k] = v
            atualizar(() => ({
              concluidas: { ...local.concluidas, ...Object.fromEntries(Object.entries(remoto.concluidas).filter(([, v]) => v)) },
              anotacoes,
              ultima: remoto.ultima ?? local.ultima,
            }))
          } else {
            const remoto = { ...VAZIO, ...snap.data() }
            servidor.current = JSON.stringify(remoto)
            // Edição local aguardando envio tem prioridade sobre a versão remota.
            if (!pendente() && JSON.stringify(ref.current) !== servidor.current) {
              ref.current = remoto
              gravar('estado', remoto)
              setEstado(remoto)
            }
          }
          setNuvem('sincronizado')
        },
        () => setNuvem('erro'),
      )
    })().catch(() => vivo && setNuvem('local'))

    window.addEventListener('pagehide', enviar)
    return () => {
      vivo = false
      cancelar()
      docRef.current = null
      window.removeEventListener('pagehide', enviar)
    }
  }, [enviar, atualizar])

  return [estado, atualizar, nuvem]
}
