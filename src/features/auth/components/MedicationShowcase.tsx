import { useId } from 'react'
import { Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

const forms = ['capsule', 'injection', 'cream', 'bottle'] as const
type MedicationForm = (typeof forms)[number]

function MedicationArtwork({ form, id }: { form: MedicationForm; id: string }) {
  const blue = `url(#${id}-blue)`
  const pearl = `url(#${id}-pearl)`
  const glass = `url(#${id}-glass)`
  return (
    <svg viewBox="0 0 480 320" fill="none" aria-hidden="true">
      <defs>
        <linearGradient
          id={`${id}-blue`}
          x1="120"
          y1="70"
          x2="300"
          y2="260"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#92A5FF" />
          <stop offset=".45" stopColor="#536DFF" />
          <stop offset="1" stopColor="#3046C8" />
        </linearGradient>
        <linearGradient
          id={`${id}-pearl`}
          x1="200"
          y1="60"
          x2="320"
          y2="270"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F0F3FF" />
          <stop offset=".5" stopColor="#BEC9FF" />
          <stop offset="1" stopColor="#8798E0" />
        </linearGradient>
        <linearGradient
          id={`${id}-glass`}
          x1="180"
          y1="50"
          x2="320"
          y2="270"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#DCF9FF" stopOpacity=".9" />
          <stop offset=".45" stopColor="#91CBE9" stopOpacity=".55" />
          <stop offset="1" stopColor="#3D789F" stopOpacity=".8" />
        </linearGradient>
        <linearGradient
          id={`${id}-amber`}
          x1="170"
          y1="80"
          x2="320"
          y2="270"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F8CC8B" />
          <stop offset=".45" stopColor="#C78B48" />
          <stop offset="1" stopColor="#764423" />
        </linearGradient>
      </defs>
      {form === 'capsule' && (
        <g transform="rotate(-25 240 160)">
          <rect x="65" y="92" width="350" height="136" rx="68" fill={pearl} />
          <path d="M240 92H133a68 68 0 0 0 0 136h107V92Z" fill={blue} />
          <path d="M240 93v134" stroke="#E5EBFF" strokeOpacity=".6" />
          <path
            d="M95 143c8-20 22-29 44-29h196"
            stroke="white"
            strokeOpacity=".35"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M142 214h184"
            stroke="#263B9B"
            strokeOpacity=".25"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      )}
      {form === 'injection' && (
        <g transform="rotate(-35 240 160)">
          <path
            d="M353 160h81"
            stroke="#DBE8FF"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="m434 160 14-2-14 5" fill="#DBE8FF" />
          <rect x="319" y="146" width="39" height="28" rx="6" fill={blue} />
          <rect
            x="142"
            y="119"
            width="185"
            height="82"
            rx="15"
            fill={glass}
            stroke="#E5F5FF"
            strokeOpacity=".65"
          />
          <path d="M228 132h86v56h-86z" fill="#6EDBCB" fillOpacity=".75" />
          <path
            d="M153 132h153"
            stroke="white"
            strokeOpacity=".65"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {[172, 195, 218, 241, 264, 287].map((x) => (
            <path
              key={x}
              d={`M${x} 187v-13`}
              stroke="#244C77"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
          <rect x="127" y="107" width="14" height="106" rx="6" fill={pearl} />
          <rect x="78" y="149" width="64" height="22" rx="6" fill={pearl} />
          <rect x="65" y="128" width="16" height="64" rx="7" fill={blue} />
          <rect x="147" y="128" width="12" height="64" rx="4" fill="#46669B" />
        </g>
      )}
      {form === 'cream' && (
        <g transform="rotate(22 240 160)">
          <path
            d="m174 52 15 184h102l15-184H174Z"
            fill={pearl}
            stroke="#E3E9FF"
            strokeOpacity=".5"
          />
          <path d="m183 159 6 77h102l6-77H183Z" fill={blue} />
          <path
            d="M179 65h122M180 74h120"
            stroke="#7D8EC5"
            strokeOpacity=".6"
            strokeWidth="3"
          />
          <path
            d="m189 88 8 57"
            stroke="white"
            strokeOpacity=".65"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <rect x="199" y="236" width="82" height="40" rx="10" fill={blue} />
          <path
            d="M205 245h70M211 267h58"
            stroke="#B2C0FF"
            strokeOpacity=".4"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M229 112h22m-11-11v22"
            stroke="#536DFF"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M218 188h44m-35 12h26"
            stroke="#E5EBFF"
            strokeOpacity=".8"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      )}
      {form === 'bottle' && (
        <g transform="rotate(-12 240 160)">
          <path
            d="M200 84h80v22c0 12 35 19 35 43v100c0 17-13 25-29 25h-92c-16 0-29-8-29-25V149c0-24 35-31 35-43V84Z"
            fill={`url(#${id}-amber)`}
            stroke="#FFE1AD"
            strokeOpacity=".45"
          />
          <rect x="191" y="48" width="98" height="44" rx="11" fill={pearl} />
          {[204, 218, 232, 246, 260, 274].map((x) => (
            <path
              key={x}
              d={`M${x} 57v25`}
              stroke="#7A8BC1"
              strokeOpacity=".55"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
          <path
            d="M181 145v88"
            stroke="#FFE5BD"
            strokeOpacity=".55"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <rect x="166" y="155" width="148" height="81" rx="4" fill={pearl} />
          <path d="M166 155h148v17H166z" fill={blue} />
          <path
            d="M229 195h22m-11-11v22"
            stroke="#536DFF"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M217 221h46"
            stroke="#8392C5"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  )
}

export function MedicationShowcase({
  compact = false,
  paused,
  onPausedChange,
}: {
  compact?: boolean
  paused: boolean
  onPausedChange: (paused: boolean) => void
}) {
  const id = useId()
  return (
    <div
      className="medication-showcase"
      data-compact={compact}
      data-paused={paused}
    >
      <div
        className="medication-stage"
        role="img"
        aria-label="Medication forms: capsule, syringe, cream tube, and medicine bottle."
      >
        <span className="medication-orbit" aria-hidden="true" />
        {forms.map((form) => (
          <div
            className="medication-model"
            data-form={form}
            key={form}
            aria-hidden="true"
          >
            <MedicationArtwork form={form} id={`${id}-${form}`} />
          </div>
        ))}
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="medication-motion-toggle"
        aria-label={
          paused ? 'Play medication animation' : 'Pause medication animation'
        }
        aria-pressed={paused}
        onClick={() => onPausedChange(!paused)}
      >
        {paused ? <Play size={16} /> : <Pause size={16} />}
      </Button>
    </div>
  )
}
