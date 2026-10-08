import { useId } from 'react';
import type { ObjectId } from '../types';

export function Sparkle({ className = '', ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path
        d="M16 1c.5 10 4.5 14 15 15-10.5 1-14.5 5-15 15C15 21 11 17 1 16 11 15 15 11 16 1Z"
        fill="currentColor"
      />
    </svg>
  );
}
export function Planet({ id, className = '' }: { id: ObjectId; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const colors: Record<ObjectId, string> = {
    mercury: '#b9ab9c',
    venus: '#e9d3a3',
    earth: '#8fbac2',
    mars: '#cf9177',
    jupiter: '#ecc8a4',
    saturn: '#e3c998',
    uranus: '#a7d6d5',
    neptune: '#7d9dc9',
    moon: '#e6e0c8',
    sirius: '#d8e6f1',
    orion: '#bccae2',
    pleiades: '#bccae2',
    andromeda: '#c7bada',
  };
  const stars = id === 'orion' || id === 'pleiades' || id === 'sirius';
  return (
    <svg className={`planet-art ${className}`} viewBox="0 0 240 240" aria-hidden="true">
      <defs>
        <clipPath id={`planet-${uid}`}>
          <circle cx="120" cy="120" r="81" />
        </clipPath>
        <radialGradient id={`shade-${uid}`} cx="32%" cy="25%" r="85%">
          <stop offset="0" stopColor="#fff9dd" stopOpacity=".19" />
          <stop offset=".7" stopColor="#fff9dd" stopOpacity="0" />
          <stop offset="1" stopColor="#223044" stopOpacity=".19" />
        </radialGradient>
      </defs>
      {id === 'saturn' && (
        <ellipse
          cx="120"
          cy="120"
          rx="117"
          ry="37"
          transform="rotate(-24 120 120)"
          fill="none"
          stroke="#c8b2a1"
          strokeWidth="17"
        />
      )}
      {stars ? (
        <>
          {id === 'orion' && (
            <path
              d="m75 40 79 25-54 50 28 8-14 10 51 68-116-20 65-48-39-93"
              fill="none"
              stroke="#9aaec4"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
          )}
          {(id === 'sirius'
            ? [
                [120, 120, 33],
                [168, 159, 6],
              ]
            : id === 'orion'
              ? [
                  [75, 40, 9],
                  [154, 65, 12],
                  [100, 115, 7],
                  [128, 123, 6],
                  [114, 133, 7],
                  [165, 201, 11],
                  [49, 181, 10],
                ]
              : [
                  [73, 99, 11],
                  [104, 73, 9],
                  [123, 110, 15],
                  [151, 69, 8],
                  [168, 138, 10],
                  [130, 162, 8],
                  [80, 150, 6],
                ]
          ).map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r * 2.4} fill={colors[id]} opacity=".07" />
              <path
                d={`M${x} ${y - r} Q${x + 2} ${y - 2} ${x + r} ${y} Q${x + 2} ${y + 2} ${x} ${y + r} Q${x - 2} ${y + 2} ${x - r} ${y} Q${x - 2} ${y - 2} ${x} ${y - r}`}
                fill={colors[id]}
              />
            </g>
          ))}
        </>
      ) : id === 'andromeda' ? (
        <g transform="rotate(-35 120 120)">
          <ellipse cx="120" cy="120" rx="104" ry="40" fill="#b2a1c5" opacity=".18" />
          <ellipse
            cx="120"
            cy="120"
            rx="87"
            ry="27"
            fill="none"
            stroke="#b6a6c9"
            strokeWidth="7"
            opacity=".5"
          />
          <ellipse cx="120" cy="120" rx="64" ry="18" fill="#d4c7d7" opacity=".65" />
          <ellipse cx="120" cy="120" rx="30" ry="11" fill="#f4e9cd" />
        </g>
      ) : (
        <>
          <circle cx="120" cy="120" r="83" fill="#122432" opacity=".16" />
          <circle cx="120" cy="120" r="81" fill={colors[id]} />
          <g clipPath={`url(#planet-${uid})`}>
            {id === 'jupiter' && (
              <>
                <path
                  d="M23 67q68 26 193 4M19 101q99 32 207 1M19 155q81 22 213-4"
                  fill="none"
                  stroke="#ba8370"
                  strokeWidth="15"
                />
                <path
                  d="M23 88q91 24 197 1M28 128q114 33 190-4M28 180q116 21 193-9"
                  fill="none"
                  stroke="#fcdfbb"
                  strokeWidth="10"
                />
                <path
                  d="M34 51q92 33 179 12M21 115q116 34 206-5M34 173q104 31 196-9"
                  fill="none"
                  stroke="#d6a48b"
                  strokeWidth="6"
                />
                <ellipse
                  cx="157"
                  cy="150"
                  rx="25"
                  ry="13"
                  fill="#bd7a64"
                  transform="rotate(-8 157 150)"
                />
                <ellipse
                  cx="157"
                  cy="149"
                  rx="17"
                  ry="7"
                  fill="#d99475"
                  transform="rotate(-8 157 149)"
                />
              </>
            )}
            {id === 'earth' && (
              <>
                <path
                  d="m49 77 27-16 18 4 10 22-18 13 17 14 3 26-17 26-7-25-16-13-22-3ZM134 38l30 19-8 24 35 9 4 28-28 5-7 40-24-11-5-38-25-17 9-20 17-1Z"
                  fill="#b9cb9f"
                />
                <path d="m151 171 28-11 15 10-16 19-23-2" fill="#c9d7a9" />
                <path
                  d="M76 52q49-28 95 1M42 127q24-7 39-3m26 38q19 11 34 7"
                  fill="none"
                  stroke="#edf2dd"
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity=".75"
                />
              </>
            )}
            {['moon', 'mercury', 'mars'].includes(id) && (
              <>
                {[
                  [86, 81, 17],
                  [156, 64, 11],
                  [150, 142, 26],
                  [71, 141, 9],
                  [113, 188, 12],
                  [166, 191, 8],
                ].map(([x, y, r], i) => (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      r={r}
                      fill={id === 'mars' ? '#a36f60' : '#b1ad9d'}
                      opacity=".45"
                    />
                    <path
                      d={`M${x - r * 0.7} ${y + 2}q0 ${-r} ${r * 1.2} ${-r * 0.7}`}
                      fill="none"
                      stroke="#fff4d8"
                      strokeWidth="3"
                      opacity=".35"
                    />
                  </g>
                ))}
              </>
            )}
            {['venus', 'saturn', 'uranus', 'neptune'].includes(id) && (
              <>
                <path
                  d="M24 84q100 20 195-2M19 122q111 26 217-8M27 157q96 24 194-6"
                  fill="none"
                  stroke="#fff0c9"
                  strokeWidth="12"
                  opacity=".28"
                />
                <path
                  d="M24 100q100 20 195-2M27 177q96 24 194-6"
                  fill="none"
                  stroke="#6e8399"
                  strokeWidth="7"
                  opacity=".16"
                />
              </>
            )}
            <circle cx="120" cy="120" r="81" fill={`url(#shade-${uid})`} />
          </g>
          {id === 'saturn' && (
            <path
              d="M17 149c8 33 181-6 210-66"
              fill="none"
              stroke="#d6c3a8"
              strokeWidth="17"
              strokeLinecap="round"
            />
          )}
        </>
      )}
    </svg>
  );
}
export function Mochi({
  mood = 'idle',
  className = '',
}: {
  mood?: 'idle' | 'excited' | 'searching' | 'confused' | 'celebrating' | 'scared';
  className?: string;
}) {
  const happy = mood === 'excited' || mood === 'celebrating';
  return (
    <svg
      className={`mochi-art ${className} mood-${mood}`}
      viewBox="0 0 210 220"
      fill="none"
      role="img"
      aria-label={`Mochi the little space explorer, ${mood}`}
    >
      <g stroke="#34424a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <rect
          x="145"
          y="123"
          width="25"
          height="44"
          rx="10"
          fill="#b4bacb"
          transform="rotate(10 145 123)"
        />
        <path
          d={happy ? 'M62 143q-28-36-35-16t26 41' : 'M60 146q-30 7-28 23t29-6'}
          fill="#f4e7c6"
        />
        <path
          d={happy ? 'M148 143q28-38 35-17t-26 42' : 'M149 149q27 9 22 22t-26-10'}
          fill="#f4e7c6"
        />
        <path d="M66 177q-13 25-1 27t25-19m36-5q1 26 15 22t1-25" fill="#eee0bd" />
        <path d="M57 150c0-31 96-37 97-1l-4 31q-42 23-88-1Z" fill="#f6e9c8" />
        <path d="M65 157q45 16 85-3" stroke="#d5bb92" />
        <circle
          cx="106"
          cy="96"
          r="72"
          fill="#b7d3dd"
          fillOpacity=".2"
          stroke="#e1e8dc"
          strokeWidth="4"
        />
        <path d="M62 60c10-18 29-26 48-25" stroke="#fff9dd" strokeWidth="6" opacity=".65" />
        <path
          d="M56 118c-8-37 9-71 46-66 15-12 49 11 52 39 11 40-12 53-46 53-32 0-48-4-52-26Z"
          fill="#fff1d1"
          strokeWidth="2.5"
        />
        <ellipse cx="75" cy="112" rx="9" ry="5" fill="#e7a596" stroke="none" opacity=".65" />
        <ellipse cx="136" cy="112" rx="9" ry="5" fill="#e7a596" stroke="none" opacity=".65" />
        {happy ? (
          <>
            <path d="m82 98 6-5 6 5m26 0 6-5 6 5" />
            <path d="M102 108q8 17 16 0Z" fill="#c48779" />
          </>
        ) : mood === 'scared' ? (
          <>
            <circle cx="90" cy="99" r="5" fill="#34424a" />
            <circle cx="124" cy="99" r="5" fill="#34424a" />
            <ellipse cx="108" cy="115" rx="5" ry="7" fill="#34424a" />
          </>
        ) : (
          <>
            <ellipse
              cx="89"
              cy="101"
              rx="3"
              ry={mood === 'confused' ? '3' : '4.5'}
              fill="#34424a"
              stroke="none"
            />
            <ellipse cx="124" cy="101" rx="3" ry="4.5" fill="#34424a" stroke="none" />
            {mood === 'confused' ? (
              <path d="M104 118q5-5 10-1m-31-31 11-3" />
            ) : (
              <path d="M103 114q5 5 10 0" />
            )}
          </>
        )}
        <path d="M74 153q31 10 62-1" stroke="#e2dac1" strokeWidth="7" />
        <rect x="92" y="165" width="25" height="15" rx="5" fill="#d1d5d2" strokeWidth="2" />
        <circle cx="100" cy="172" r="2" fill="#dd9c7d" stroke="none" />
        <path d="M107 172h4" strokeWidth="2" />
        {mood === 'searching' && (
          <g transform="rotate(-20 144 129)">
            <path d="M142 124h43v18h-43Z" fill="#aeb9cc" />
            <path d="M181 119h10v28h-10Z" fill="#e8cf94" />
            <path d="M163 143v26" />
          </g>
        )}
      </g>
      {happy && (
        <>
          <path
            d="m177 57 4-12m6 20 12-5M27 86l-10-6"
            stroke="#e8c983"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <Sparkle x="158" y="26" width="18" height="18" color="#e8c983" />
        </>
      )}
      {mood === 'confused' && (
        <text x="164" y="57" fill="#e8c983" fontSize="29" fontFamily="serif">
          ?
        </text>
      )}
    </svg>
  );
}
export function SkyScene({ target = 'jupiter' }: { target?: ObjectId }) {
  return (
    <div className="sky-scene" aria-label="Mochi floating beside a tiny Jupiter">
      <svg className="scene-orbits" viewBox="0 0 560 420" aria-hidden="true">
        <ellipse
          cx="300"
          cy="195"
          rx="230"
          ry="128"
          transform="rotate(-23 300 195)"
          fill="none"
          stroke="#67777a"
          strokeWidth="1"
          strokeDasharray="3 8"
        />
        <ellipse
          cx="300"
          cy="195"
          rx="202"
          ry="163"
          transform="rotate(20 300 195)"
          fill="none"
          stroke="#425862"
          strokeWidth="1"
        />
        <path d="M370 72q59-26 111-6" fill="none" stroke="#667881" />
        <circle cx="476" cy="72" r="8" fill="#c7c7b5" />
        <circle cx="103" cy="270" r="6" fill="#dabd94" />
        <circle cx="358" cy="347" r="4" fill="#a3b6bc" />
        <path d="m94 91 9 3-8 7 2-10" fill="#e6ca88" />
        <circle cx="293" cy="34" r="2" fill="#e4d6b0" />
      </svg>
      <div className="scene-planet">
        <Planet id={target} />
      </div>
      <div className="scene-mochi">
        <Mochi mood="excited" />
      </div>
      <div className="scene-note">
        a universe of little wonders{' '}
        <svg viewBox="0 0 72 30">
          <path
            d="M2 8q40-16 61 15m-12-1 13 3-1-11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
          />
        </svg>
      </div>
      <span className="coordinate-note">YOUR CURIOSITY IS THE COMPASS</span>
      <Sparkle className="scene-spark spark-one" />
      <Sparkle className="scene-spark spark-two" />
      <div className="scene-moon">
        <Planet id="moon" />
      </div>
    </div>
  );
}
