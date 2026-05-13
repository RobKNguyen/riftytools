interface Props {
  message: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  message,
  confirmLabel = 'Confirm',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button className="dialog-cancel" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className={`dialog-confirm${danger ? ' danger' : ''}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
