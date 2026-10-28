import { QRCodeSVG } from 'qrcode.react'
import { audienceJoinUrl } from '../lib/audienceJoinUrl'

const QR_SIZE = 112

export function ShowJoinQr({ roomCode }: { roomCode: string }) {
  if (!roomCode) return null
  const url = audienceJoinUrl(roomCode)
  return (
    <div className="show-qr" aria-label={`Scan to join room ${roomCode}`}>
      <QRCodeSVG value={url} size={QR_SIZE} bgColor="#ffffff" fgColor="#1a1b1e" level="M" />
      <span className="show-qr-caption">
        {roomCode} · Scan to join · 掃描加入
      </span>
    </div>
  )
}
