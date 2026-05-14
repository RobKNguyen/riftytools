import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import type { AppDispatch, RootState } from '../app/store'
import { fetchLegends } from '../features/legends/legendsSlice'
import { fetchFormats } from '../features/formats/formatsSlice'
import { switchboard } from '../services/switchboard'
import type { LegendVariant } from '../features/legendVariants/legendVariantSlice'
import { WIN_GUID, LOSS_GUID, DRAW_GUID, RESULT_TYPES, computeMatchResult } from '../constants'
import LegendSelect from './LegendSelect'

export interface EditableResult {
  guid: string
  format_guid: string
  legenduser_guid: string
  legendopp_guid: string
  wentfirst: boolean
  resultfirst: string
  resultsecond: string | null
  resultthird: string | null
  legenduservariant_guid?: string | null
  legendoppvariant_guid?: string | null
  notes?: string | null
  // fallback name fields used when GUID fields are empty
  format?: string
  legenduser?: string
  legendopp?: string
  game1?: string
  game2?: string | null
  game3?: string | null
}

function strToGuid(s: string | null | undefined): string {
  if (s === 'Win') return WIN_GUID
  if (s === 'Loss') return LOSS_GUID
  if (s === 'Draw') return DRAW_GUID
  return ''
}

interface Props {
  result: EditableResult
  onClose: () => void
  onSuccess: () => void
}

export default function EditResultModal({ result, onClose, onSuccess }: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const formats = useSelector((state: RootState) => state.formats.data)
  const legends = useSelector((state: RootState) => state.legends.data)
  const formatsStatus = useSelector((state: RootState) => state.formats.status)
  const legendsStatus = useSelector((state: RootState) => state.legends.status)
  const userGuid = useSelector((state: RootState) => state.user.guid)
  const userRole = useSelector((state: RootState) => state.user.role)

  useEffect(() => {
    if (formatsStatus === 'idle') dispatch(fetchFormats())
    if (legendsStatus === 'idle') dispatch(fetchLegends())
  }, [dispatch, formatsStatus, legendsStatus])

  const [formatGuid, setFormatGuid] = useState(result.format_guid)
  const [legendUserGuid, setLegendUserGuid] = useState(result.legenduser_guid)
  const [legendOppGuid, setLegendOppGuid] = useState(result.legendopp_guid)
  const [wentFirst, setWentFirst] = useState(result.wentfirst)
  const [game1, setGame1] = useState(result.resultfirst || strToGuid(result.game1))
  const [game2, setGame2] = useState(result.resultsecond ?? strToGuid(result.game2))
  const [game3, setGame3] = useState(result.resultthird ?? strToGuid(result.game3))
  const [userVariantGuid, setUserVariantGuid] = useState(result.legenduservariant_guid ?? '')
  const [oppVariantGuid, setOppVariantGuid] = useState(result.legendoppvariant_guid ?? '')
  const [userVariants, setUserVariants] = useState<LegendVariant[]>([])
  const [oppVariants, setOppVariants] = useState<LegendVariant[]>([])
  const [notes, setNotes] = useState(result.notes ?? '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!legendUserGuid) { setUserVariants([]); return }
    const roles = userRole ? [userRole] : ['Player']
    switchboard<LegendVariant[]>('LegendVariants_Out', { Legend_GUID: legendUserGuid }, roles)
      .then(res => setUserVariants(res.Data ?? []))
  }, [legendUserGuid, userRole])

  useEffect(() => {
    if (!legendOppGuid) { setOppVariants([]); return }
    const roles = userRole ? [userRole] : ['Player']
    switchboard<LegendVariant[]>('LegendVariants_Out', { Legend_GUID: legendOppGuid }, roles)
      .then(res => setOppVariants(res.Data ?? []))
  }, [legendOppGuid, userRole])

  // Fallback: look up GUIDs by name when the API didn't return GUID fields
  useEffect(() => {
    if (!formatGuid && result.format && formats.length > 0) {
      setFormatGuid(formats.find((f) => f.name === result.format)?.guid ?? '')
    }
  }, [formats, formatGuid, result.format])

  useEffect(() => {
    if (legends.length > 0) {
      if (!legendUserGuid && result.legenduser)
        setLegendUserGuid(legends.find((l) => l.name === result.legenduser)?.guid ?? '')
      if (!legendOppGuid && result.legendopp)
        setLegendOppGuid(legends.find((l) => l.name === result.legendopp)?.guid ?? '')
    }
  }, [legends, legendUserGuid, legendOppGuid, result.legenduser, result.legendopp])

  const selectedFormat = formats.find((f) => f.guid === formatGuid)
  const maxGames = selectedFormat?.maxgames ?? 0
  const matchResult = computeMatchResult(game1, game2, game3, maxGames)

  const isValid =
    formatGuid && legendUserGuid && legendOppGuid && game1 &&
    (maxGames < 2 || game2) && matchResult !== ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || !userGuid) return
    setSubmitting(true)

    const payload: Record<string, string | boolean | null> = {
      GUID: result.guid,
      Format_GUID: formatGuid,
      User_GUID: userGuid,
      LegendUser_GUID: legendUserGuid,
      LegendOpp_GUID: legendOppGuid,
      WentFirst: wentFirst,
      ResultType_GUID: matchResult,
      ResultFirst: game1,
      ResultSecond: maxGames >= 2 && game2 ? game2 : null,
      ResultThird: maxGames >= 3 && game3 ? game3 : null,
    }
    if (userVariantGuid) payload['LegendUserVariant_GUID'] = userVariantGuid
    if (oppVariantGuid) payload['LegendOppVariant_GUID'] = oppVariantGuid
    if (notes.trim()) payload['Notes'] = notes.trim()

    const data = await switchboard('GameResult_In', payload, [userRole ?? 'Player'])
    setSubmitting(false)

    if (data.Success) {
      toast.success('Result updated')
      onSuccess()
      onClose()
    } else {
      toast.error('Could not update result')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Result</h2>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Format</label>
            <div className="format-grid">
              {formats.map((f) => (
                <button
                  key={f.guid}
                  type="button"
                  className={`format-pill${formatGuid === f.guid ? ' active' : ''}`}
                  onClick={() => { setFormatGuid(f.guid); setGame1(''); setGame2(''); setGame3('') }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <div className="form-row">
              <div>
                <label className="form-label">Your Legend</label>
                <LegendSelect value={legendUserGuid} onChange={setLegendUserGuid} legends={legends} placeholder="Select legend…" />
              </div>
              <div>
                <label className="form-label">Opponent's Legend</label>
                <LegendSelect value={legendOppGuid} onChange={setLegendOppGuid} legends={legends} placeholder="Select legend…" />
              </div>
            </div>
          </div>

          {(userVariants.length > 0 || oppVariants.length > 0) && (
            <div className="form-group">
              <div className="form-row">
                <div>
                  <label className="form-label">
                    Variant{' '}
                    <span style={{ color: '#484f58', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— optional</span>
                  </label>
                  <select className="form-select" value={userVariantGuid} onChange={(e) => setUserVariantGuid(e.target.value)} disabled={userVariants.length === 0}>
                    <option value="">None</option>
                    {userVariants.map((v) => <option key={v.guid} value={v.guid}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">
                    Opponent Variant{' '}
                    <span style={{ color: '#484f58', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— optional</span>
                  </label>
                  <select className="form-select" value={oppVariantGuid} onChange={(e) => setOppVariantGuid(e.target.value)} disabled={oppVariants.length === 0}>
                    <option value="">None</option>
                    {oppVariants.map((v) => <option key={v.guid} value={v.guid}>{v.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Initiative</label>
            <div className="btn-group">
              <button type="button" className={`btn-opt${wentFirst ? ' active' : ''}`} onClick={() => setWentFirst(true)}>Went First</button>
              <button type="button" className={`btn-opt${!wentFirst ? ' active' : ''}`} onClick={() => setWentFirst(false)}>Went Second</button>
            </div>
          </div>

          {maxGames > 0 && (
            <>
              <div className="divider" />
              <p className="section-title">Game Results</p>

              <div className="form-group">
                <label className="form-label">Game 1</label>
                <div className="btn-group">
                  {RESULT_TYPES.map((r) => (
                    <button key={r.guid} type="button"
                      className={`btn-opt ${r.label.toLowerCase()}${game1 === r.guid ? ' active' : ''}`}
                      onClick={() => setGame1(r.guid)}
                    >{r.label}</button>
                  ))}
                </div>
              </div>

              {maxGames >= 2 && (
                <div className="form-group">
                  <label className="form-label">Game 2</label>
                  <div className="btn-group">
                    {RESULT_TYPES.map((r) => (
                      <button key={r.guid} type="button"
                        className={`btn-opt ${r.label.toLowerCase()}${game2 === r.guid ? ' active' : ''}`}
                        onClick={() => setGame2(r.guid)}
                      >{r.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {maxGames >= 3 && (
                <div className="form-group">
                  <label className="form-label">
                    Game 3{' '}
                    <span style={{ color: '#484f58', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                      — if played
                    </span>
                  </label>
                  <div className="btn-group">
                    {RESULT_TYPES.map((r) => (
                      <button key={r.guid} type="button"
                        className={`btn-opt ${r.label.toLowerCase()}${game3 === r.guid ? ' active' : ''}`}
                        onClick={() => setGame3((g) => (g === r.guid ? '' : r.guid))}
                      >{r.label}</button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label className="form-label">
              Match Notes{' '}
              <span style={{ color: '#484f58', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— optional</span>
            </label>
            <textarea
              className="form-select notes-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this match…"
              rows={3}
            />
          </div>

          <button type="submit" className="submit-btn" style={{ marginTop: '8px' }} disabled={!isValid || submitting}>
            {submitting ? 'Saving…' : 'Update Result'}
          </button>
        </form>
      </div>
    </div>
  )
}
