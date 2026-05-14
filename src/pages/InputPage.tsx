import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { updateField, resetForm, submitGameResult } from '../features/gameResult/gameResultSlice'
import { fetchLegends } from '../features/legends/legendsSlice'
import { fetchFormats } from '../features/formats/formatsSlice'
import { fetchUsers } from '../features/users/usersSlice'
import { switchboard } from '../services/switchboard'
import type { LegendVariant } from '../features/legendVariants/legendVariantSlice'
import {
  RESULT_TYPES,
  WIN_GUID,
  LOSS_GUID,
  DRAW_GUID,
  computeMatchResult,
} from '../constants'
import Nav from '../components/Nav'
import LegendSelect from '../components/LegendSelect'
import UserSelect from '../components/UserSelect'

function resultLabel(guid: string): string {
  if (guid === WIN_GUID)  return 'Win'
  if (guid === LOSS_GUID) return 'Loss'
  if (guid === DRAW_GUID) return 'Draw'
  return '—'
}

function resultClass(guid: string): string {
  if (guid === WIN_GUID)  return 'win'
  if (guid === LOSS_GUID) return 'loss'
  if (guid === DRAW_GUID) return 'draw'
  return ''
}

export default function InputPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { form, status, error, lastGUID } = useSelector(
    (state: RootState) => state.gameResult
  )
  const { data: legends, status: legendsStatus } = useSelector(
    (state: RootState) => state.legends
  )
  const { data: formats, status: formatsStatus } = useSelector(
    (state: RootState) => state.formats
  )
  const { data: users, status: usersStatus } = useSelector(
    (state: RootState) => state.users
  )
  const userGuid = useSelector((state: RootState) => state.user.guid)
  const userRole = useSelector((state: RootState) => state.user.role)

  const [userVariants, setUserVariants] = useState<LegendVariant[]>([])
  const [oppVariants, setOppVariants] = useState<LegendVariant[]>([])

  useEffect(() => {
    if (legendsStatus === 'idle') dispatch(fetchLegends())
    if (formatsStatus === 'idle') dispatch(fetchFormats())
    if (usersStatus === 'idle') dispatch(fetchUsers())
  }, [dispatch, legendsStatus, formatsStatus, usersStatus])

  useEffect(() => {
    if (!form.LegendUser_GUID) { setUserVariants([]); return }
    const roles = userRole ? [userRole] : ['Player']
    switchboard<LegendVariant[]>('LegendVariants_Out', { Legend_GUID: form.LegendUser_GUID }, roles)
      .then(res => setUserVariants(res.Data ?? []))
  }, [form.LegendUser_GUID, userRole])

  useEffect(() => {
    if (!form.LegendOpp_GUID) { setOppVariants([]); return }
    const roles = userRole ? [userRole] : ['Player']
    switchboard<LegendVariant[]>('LegendVariants_Out', { Legend_GUID: form.LegendOpp_GUID }, roles)
      .then(res => setOppVariants(res.Data ?? []))
  }, [form.LegendOpp_GUID, userRole])

  const selectedFormat = formats.find((f) => f.guid === form.Format_GUID)
  const maxGames = selectedFormat?.maxgames ?? 0

  const matchResult = computeMatchResult(
    form.ResultFirst,
    form.ResultSecond,
    form.ResultThird,
    maxGames,
  )

  const isValid =
    form.Format_GUID !== '' &&
    form.LegendUser_GUID !== '' &&
    form.LegendOpp_GUID !== '' &&
    form.ResultFirst !== '' &&
    (maxGames < 2 || form.ResultSecond !== '') &&
    matchResult !== ''

  const prevStatus = useRef(status)
  useEffect(() => {
    if (prevStatus.current === 'loading' && status === 'success') {
      toast.success('Match submitted!')
      dispatch(resetForm())
    }
    if (prevStatus.current === 'loading' && status === 'error') {
      toast.error('Something went wrong. Please try again.')
    }
    prevStatus.current = status
  }, [status, dispatch])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    dispatch(
      submitGameResult({
        Format_GUID: form.Format_GUID,
        User_GUID: userGuid ?? '',
        LegendUser_GUID: form.LegendUser_GUID,
        LegendOpp_GUID: form.LegendOpp_GUID,
        WentFirst: form.WentFirst,
        ResultType_GUID: matchResult,
        ResultFirst: form.ResultFirst,
        ResultSecond: maxGames >= 2 && form.ResultSecond !== '' ? form.ResultSecond : null,
        ResultThird: maxGames >= 3 && form.ResultThird !== '' ? form.ResultThird : null,
        OppUser_GUID: form.OppUser_GUID || undefined,
        LegendUserVariant_GUID: form.LegendUserVariant_GUID || undefined,
        LegendOppVariant_GUID: form.LegendOppVariant_GUID || undefined,
        Notes: form.Notes.trim() || undefined,
      })
    )
  }

  const loading = legendsStatus === 'loading' || formatsStatus === 'loading'

  return (
    <div>
      <Nav />
      <main className="page">
        <div className="card">
          <h1 className="page-title">
            Submit <span>Result</span>
          </h1>

          {loading && <p className="placeholder-text">Loading…</p>}

          {!loading && (
            <form onSubmit={handleSubmit}>
              {/* Format */}
              <div className="form-group">
                <label className="form-label">Format</label>
                <div className="format-grid">
                  {formats.map((f) => (
                    <button
                      key={f.guid}
                      type="button"
                      className={`format-pill${form.Format_GUID === f.guid ? ' active' : ''}`}
                      onClick={() =>
                        dispatch(
                          updateField({
                            Format_GUID: f.guid,
                            ResultFirst: '',
                            ResultSecond: '',
                            ResultThird: '',
                          })
                        )
                      }
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Legends */}
              <div className="form-group">
                <div className="form-row">
                  <div>
                    <label className="form-label">Your Legend</label>
                    <LegendSelect
                      value={form.LegendUser_GUID}
                      onChange={(guid) => dispatch(updateField({ LegendUser_GUID: guid, LegendUserVariant_GUID: '' }))}
                      legends={legends}
                      placeholder="Select legend…"
                    />
                  </div>
                  <div>
                    <label className="form-label">Opponent's Legend</label>
                    <LegendSelect
                      value={form.LegendOpp_GUID}
                      onChange={(guid) => dispatch(updateField({ LegendOpp_GUID: guid, LegendOppVariant_GUID: '' }))}
                      legends={legends}
                      placeholder="Select legend…"
                    />
                  </div>
                </div>
              </div>

              {/* Variants */}
              {(userVariants.length > 0 || oppVariants.length > 0) && (
                <div className="form-group">
                  <div className="form-row">
                    <div>
                      <label className="form-label">
                        Variant{' '}
                        <span style={{ color: '#484f58', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— optional</span>
                      </label>
                      <select
                        className="form-select"
                        value={form.LegendUserVariant_GUID}
                        onChange={(e) => dispatch(updateField({ LegendUserVariant_GUID: e.target.value }))}
                        disabled={userVariants.length === 0}
                      >
                        <option value="">None</option>
                        {userVariants.map((v) => <option key={v.guid} value={v.guid}>{v.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">
                        Opponent Variant{' '}
                        <span style={{ color: '#484f58', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— optional</span>
                      </label>
                      <select
                        className="form-select"
                        value={form.LegendOppVariant_GUID}
                        onChange={(e) => dispatch(updateField({ LegendOppVariant_GUID: e.target.value }))}
                        disabled={oppVariants.length === 0}
                      >
                        <option value="">None</option>
                        {oppVariants.map((v) => <option key={v.guid} value={v.guid}>{v.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Opponent user (optional) */}
              <div className="form-group">
                <label className="form-label">
                  Opponent{' '}
                  <span style={{ color: '#484f58', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                    — optional
                  </span>
                </label>
                <UserSelect
                  value={form.OppUser_GUID}
                  onChange={(guid) => dispatch(updateField({ OppUser_GUID: guid }))}
                  users={users}
                  placeholder="Select opponent…"
                />
              </div>

              {/* Initiative */}
              <div className="form-group">
                <label className="form-label">Initiative</label>
                <div className="btn-group">
                  <button
                    type="button"
                    className={`btn-opt${form.WentFirst ? ' active' : ''}`}
                    onClick={() => dispatch(updateField({ WentFirst: true }))}
                  >
                    Went First
                  </button>
                  <button
                    type="button"
                    className={`btn-opt${!form.WentFirst ? ' active' : ''}`}
                    onClick={() => dispatch(updateField({ WentFirst: false }))}
                  >
                    Went Second
                  </button>
                </div>
              </div>

              {/* Game-by-game results */}
              {maxGames > 0 && (
                <>
                  <div className="divider" />
                  <p className="section-title">Game Results</p>

                  <div className="form-group">
                    <label className="form-label">Game 1</label>
                    <div className="btn-group">
                      {RESULT_TYPES.map((r) => (
                        <button
                          key={r.guid}
                          type="button"
                          className={`btn-opt ${r.label.toLowerCase()}${form.ResultFirst === r.guid ? ' active' : ''}`}
                          onClick={() => dispatch(updateField({ ResultFirst: r.guid }))}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {maxGames >= 2 && (
                    <div className="form-group">
                      <label className="form-label">Game 2</label>
                      <div className="btn-group">
                        {RESULT_TYPES.map((r) => (
                          <button
                            key={r.guid}
                            type="button"
                            className={`btn-opt ${r.label.toLowerCase()}${form.ResultSecond === r.guid ? ' active' : ''}`}
                            onClick={() => dispatch(updateField({ ResultSecond: r.guid }))}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {maxGames >= 3 && (
                    <div className="form-group">
                      <label className="form-label">
                        Game 3{' '}
                        <span
                          style={{
                            color: '#484f58',
                            fontWeight: 400,
                            textTransform: 'none',
                            letterSpacing: 0,
                          }}
                        >
                          — if played
                        </span>
                      </label>
                      <div className="btn-group">
                        {RESULT_TYPES.map((r) => (
                          <button
                            key={r.guid}
                            type="button"
                            className={`btn-opt ${r.label.toLowerCase()}${form.ResultThird === r.guid ? ' active' : ''}`}
                            onClick={() =>
                              dispatch(
                                updateField({
                                  ResultThird:
                                    form.ResultThird === r.guid ? '' : r.guid,
                                })
                              )
                            }
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Auto-calculated match result */}
                  {matchResult !== '' && (
                    <div className="form-group">
                      <label className="form-label">Match Result</label>
                      <div className={`result-indicator ${resultClass(matchResult)}`}>
                        {resultLabel(matchResult)}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">
                  Match Notes{' '}
                  <span style={{ color: '#484f58', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— optional</span>
                </label>
                <textarea
                  className="form-select notes-textarea"
                  value={form.Notes}
                  onChange={(e) => dispatch(updateField({ Notes: e.target.value }))}
                  placeholder="Any notes about this match…"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={!isValid || status === 'loading'}
              >
                {status === 'loading' ? 'Submitting…' : 'Submit Result'}
              </button>

            </form>
          )}
        </div>
      </main>
    </div>
  )
}
