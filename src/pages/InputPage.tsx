import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../app/store'
import { updateField, resetForm, submitGameResult } from '../features/gameResult/gameResultSlice'
import { fetchLegends } from '../features/legends/legendsSlice'
import { fetchFormats } from '../features/formats/formatsSlice'
import {
  RESULT_TYPES,
  WIN_GUID,
  LOSS_GUID,
  DRAW_GUID,
  TEST_USER_GUID,
  computeMatchResult,
} from '../constants'
import Nav from '../components/Nav'
import LegendSelect from '../components/LegendSelect'

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

  useEffect(() => {
    if (legendsStatus === 'idle') dispatch(fetchLegends())
    if (formatsStatus === 'idle') dispatch(fetchFormats())
  }, [dispatch, legendsStatus, formatsStatus])

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    dispatch(
      submitGameResult({
        Format_GUID: form.Format_GUID,
        User_GUID: TEST_USER_GUID,
        LegendUser_GUID: form.LegendUser_GUID,
        LegendOpp_GUID: form.LegendOpp_GUID,
        WentFirst: form.WentFirst,
        ResultType_GUID: matchResult,
        ResultFirst: form.ResultFirst,
        ResultSecond: maxGames >= 2 && form.ResultSecond !== '' ? form.ResultSecond : null,
        ResultThird: maxGames >= 3 && form.ResultThird !== '' ? form.ResultThird : null,
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
                <div className="btn-group">
                  {formats.map((f) => (
                    <button
                      key={f.guid}
                      type="button"
                      className={`btn-opt${form.Format_GUID === f.guid ? ' active' : ''}`}
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
                      onChange={(guid) => dispatch(updateField({ LegendUser_GUID: guid }))}
                      legends={legends}
                      placeholder="Select legend…"
                    />
                  </div>
                  <div>
                    <label className="form-label">Opponent's Legend</label>
                    <LegendSelect
                      value={form.LegendOpp_GUID}
                      onChange={(guid) => dispatch(updateField({ LegendOpp_GUID: guid }))}
                      legends={legends}
                      placeholder="Select legend…"
                    />
                  </div>
                </div>
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

              <button
                type="submit"
                className="submit-btn"
                disabled={!isValid || status === 'loading'}
              >
                {status === 'loading' ? 'Submitting…' : 'Submit Result'}
              </button>

              {status === 'success' && (
                <div className="status-msg success">
                  <span>Result submitted!{lastGUID ? ` GUID: ${lastGUID}` : ''}</span>
                  <button
                    type="button"
                    className="reset-link"
                    onClick={() => dispatch(resetForm())}
                  >
                    Submit another
                  </button>
                </div>
              )}

              {status === 'error' && (
                <div className="status-msg error">{error}</div>
              )}
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
