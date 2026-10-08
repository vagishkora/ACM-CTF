import { 
  Challenge, 
  EventConfig, 
  LeaderboardEntry, 
  Announcement, 
  Team, 
  User 
} from '../types'

export const INITIAL_EVENT_CONFIG: EventConfig = {
  id: 'acm-nearai-ctf-2026',
  title: 'ACM × NEAR.AI CTF',
  edition: '2026 Invitational',
  organizer: 'ACM Student Chapter',
  collaborator: 'NEAR.AI',
  durationHours: 6,
  // 6 hour duration relative to active state
  startTime: new Date(Date.now() - 2 * 3600 * 1000 - 18 * 60 * 1000).toISOString(), // 2h 18m elapsed
  endTime: new Date(Date.now() + 3 * 3600 * 1000 + 42 * 60 * 1000).toISOString(),   // 3h 42m remaining
  status: 'LIVE',
  isRegistrationOpen: true,
  totalChallengesMock: 14,
  acmContributionPercent: 75,
  nearAiContributionPercent: 25,
}

export const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 'ch-web-01',
    slug: 'forgotten-door',
    title: 'Forgotten Door',
    category: 'Web',
    difficulty: 'Easy',
    points: 100,
    source: 'ACM',
    author: 'ACM Web SIG',
    description: `A legacy administrative gateway was left exposed behind a poorly configured reverse proxy header validation.
    
Inspect the HTTP request flow, locate the internal bypass header, and retrieve the administrative authorization flag.
    
\`\`\`http
GET /internal/status HTTP/1.1
Host: gateway.target.acm.internal
X-Forwarded-For: 127.0.0.1
\`\`\`
    
Target service is active below.`,
    solvesCount: 38,
    isSolved: true,
    solvedAt: '2026-10-08T14:45:00Z',
    target: {
      id: 'inst-01',
      host: 'ch-web-01.sandbox.ctf.internal',
      port: 8080,
      protocol: 'http',
      status: 'running',
      expiresInSeconds: 1640
    },
    hints: [
      {
        id: 'h-web-01-1',
        order: 1,
        content: 'Check non-standard proxy headers such as X-Custom-Origin and X-Real-IP.',
        cost: 15,
        isUnlocked: true
      }
    ]
  },
  {
    id: 'ch-rev-01',
    slug: 'dead-packet',
    title: 'Dead Packet',
    category: 'Reverse Engineering',
    difficulty: 'Medium',
    points: 200,
    source: 'ACM',
    author: 'Binary Analysis Team',
    description: `A lightweight telemetry agent dispatches encoded packets across UDP. 
    
Reverse engineer the unpacked ELF binary to understand the checksum algorithm and recover the hardcoded seed key.
    
Static analysis hint: Notice the custom XOR transformation preceding the CRC32 check in \`sub_4012A0\`.`,
    solvesCount: 19,
    isSolved: true,
    solvedAt: '2026-10-08T15:20:00Z',
    files: [
      {
        name: 'telemetry_agent_x86_64',
        size: '42.8 KB',
        sha256: '9f83a218d401a754b2384a6c0c1b48d1a1b18d84a7e4b9c1d2e3f4a5b6c7d8e9',
        downloadUrl: '#mock-download'
      }
    ],
    hints: [
      {
        id: 'h-rev-01-1',
        order: 1,
        content: 'Ghidra decompilation for sub_4012A0 shows a cyclic shift before indexing.',
        cost: 25,
        isUnlocked: false
      }
    ]
  },
  {
    id: 'ch-near-01',
    slug: 'prompt-sandbox-leak',
    title: 'Model Guardrail Bypass',
    category: 'Miscellaneous',
    difficulty: 'Medium',
    points: 250,
    source: 'NEAR.AI',
    author: 'NEAR.AI Research',
    description: `A sandboxed autonomous agent evaluator is conditioned to protect a secret verification flag stored within its system prompt context.
    
Craft an adversarial input string that bypasses the evaluator's multi-tier semantic filter without triggering rule violations.
    
*Contributed as part of the NEAR.AI track evaluating robustness of autonomous agent systems.*`,
    solvesCount: 14,
    isSolved: false,
    target: {
      id: 'inst-near-01',
      host: 'eval-agent.near.internal',
      port: 9001,
      protocol: 'tcp',
      status: 'stopped'
    },
    hints: [
      {
        id: 'h-near-01-1',
        order: 1,
        content: 'Consider recursive role-reversal structures or token fragmentation across linguistic encoding.',
        cost: 30,
        isUnlocked: false
      }
    ]
  },
  {
    id: 'ch-crypto-01',
    slug: 'broken-cipher',
    title: 'Broken Cipher',
    category: 'Crypto',
    difficulty: 'Easy',
    points: 100,
    source: 'ACM',
    author: 'ACM Crypto SIG',
    description: `A homebrewed stream cipher combines a linear-feedback shift register (LFSR) with a weak non-linear combiner.
    
Given 64 bytes of known keystream sample in the provided transcript, recover the internal state and decrypt the encrypted flag string.`,
    solvesCount: 42,
    isSolved: true,
    solvedAt: '2026-10-08T14:15:00Z',
    files: [
      {
        name: 'cipher_output.txt',
        size: '1.2 KB',
        sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
        downloadUrl: '#mock-download'
      },
      {
        name: 'encryptor.py',
        size: '2.4 KB',
        sha256: 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
        downloadUrl: '#mock-download'
      }
    ],
    hints: [
      {
        id: 'h-crypto-01-1',
        order: 1,
        content: 'The Berlekamp-Massey algorithm can determine the minimal polynomial from the prefix.',
        cost: 15,
        isUnlocked: false
      }
    ]
  },
  {
    id: 'ch-pwn-01',
    slug: 'stack-boundary',
    title: 'Stack Boundary',
    category: 'Pwn',
    difficulty: 'Hard',
    points: 350,
    source: 'ACM',
    author: 'ACM Systems Group',
    description: `The authentication parser allocates an 80-byte stack buffer without verifying boundary bounds against network read length.
    
Binary protections enabled:
- Partial RELRO
- No Canary found
- NX Enabled
- ASLR Active
    
Construct a ROP chain utilizing the provided libc gadget offsets to invoke \`execve("/bin/sh")\` and extract \`/home/ctf/flag.txt\`.`,
    solvesCount: 9,
    isSolved: false,
    files: [
      {
        name: 'stack_parser.bin',
        size: '18.4 KB',
        sha256: '445566778899aabbccddeeff00112233445566778899aabbccddeeff00112233',
        downloadUrl: '#mock-download'
      },
      {
        name: 'libc.so.6',
        size: '2.1 MB',
        sha256: 'bbccddeeff00112233445566778899aabbccddeeff00112233445566778899aa',
        downloadUrl: '#mock-download'
      }
    ],
    target: {
      id: 'inst-pwn-01',
      host: 'pwn-target.acm.internal',
      port: 1337,
      protocol: 'tcp',
      status: 'stopped'
    },
    hints: [
      {
        id: 'h-pwn-01-1',
        order: 1,
        content: 'Use puts() to leak a libc GOT address before returning back to main.',
        cost: 35,
        isUnlocked: false
      }
    ]
  },
  {
    id: 'ch-forensics-01',
    slug: 'ghost-in-the-metadata',
    title: 'Ghost in the Metadata',
    category: 'Forensics',
    difficulty: 'Easy',
    points: 100,
    source: 'ACM',
    author: 'Digital Forensics Lab',
    description: `A suspect workstation disk image contains a wiped document. 
    
Extract the filesystem journal, examine unallocated inode sectors, and assemble fragmented streams to recover the deleted flag artifact.`,
    solvesCount: 45,
    isSolved: true,
    solvedAt: '2026-10-08T14:30:00Z',
    files: [
      {
        name: 'investigation_evidence.raw.gz',
        size: '14.2 MB',
        sha256: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
        downloadUrl: '#mock-download'
      }
    ],
    hints: [
      {
        id: 'h-forensics-01-1',
        order: 1,
        content: 'Check SQLite database WAL (Write-Ahead Log) logs inside the temporary browser cache folder.',
        cost: 15,
        isUnlocked: true
      }
    ]
  },
  {
    id: 'ch-near-02',
    slug: 'wasm-contract-flaw',
    title: 'State Verifier Invariant',
    category: 'Web',
    difficulty: 'Hard',
    points: 350,
    source: 'NEAR.AI',
    author: 'NEAR.AI Core Protocol',
    description: `An autonomous state-transition verifier compiled to WebAssembly evaluates computational assertions.
    
Due to an unchecked arithmetic boundary in state serialization, an adversary can forge valid proof commitments without executing the state function.
    
Find the invariant violation and submit the generated proof token.
    
*Contributed by NEAR.AI technical mentors.*`,
    solvesCount: 6,
    isSolved: false,
    files: [
      {
        name: 'verifier_runtime.wasm',
        size: '124.5 KB',
        sha256: 'eeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100ff',
        downloadUrl: '#mock-download'
      }
    ],
    hints: [
      {
        id: 'h-near-02-1',
        order: 1,
        content: 'Inspect the 64-bit integer packing in the memory serialization hook.',
        cost: 40,
        isUnlocked: false
      }
    ]
  },
  {
    id: 'ch-osint-01',
    slug: 'orbital-beacon',
    title: 'Orbital Beacon',
    category: 'OSINT',
    difficulty: 'Medium',
    points: 175,
    source: 'ACM',
    author: 'ACM Research',
    description: `An intercepted amateur satellite signal telemetry log provides orbital pass timestamps and Doppler shift curves.
    
Correlate the ephemeris data with public TLE orbital records from early 2026 to identify the ground station callsign and station grid locator.`,
    solvesCount: 22,
    isSolved: false,
    files: [
      {
        name: 'doppler_telemetry_dump.csv',
        size: '86.4 KB',
        sha256: '5566778899aabbccddeeff00112233445566778899aabbccddeeff0011223344',
        downloadUrl: '#mock-download'
      }
    ],
    hints: [
      {
        id: 'h-osint-01-1',
        order: 1,
        content: 'The inclination angle matches low Earth orbit weather observation constellations.',
        cost: 20,
        isUnlocked: false
      }
    ]
  },
  {
    id: 'ch-web-02',
    slug: 'jwt-kid-confusion',
    title: 'Key ID Confusion',
    category: 'Web',
    difficulty: 'Medium',
    points: 225,
    source: 'ACM',
    author: 'ACM Web SIG',
    description: `A session service validates JWT signatures against a remote JWKS endpoint. 
    
However, the \`kid\` header parameter in incoming tokens is passed directly into a local filesystem path query without sanitization.
    
Exploit the path confusion to force verification with a known local public key or empty file.`,
    solvesCount: 17,
    isSolved: false,
    target: {
      id: 'inst-web-02',
      host: 'auth-validator.acm.internal',
      port: 8443,
      protocol: 'http',
      status: 'stopped'
    },
    hints: [
      {
        id: 'h-web-02-1',
        order: 1,
        content: 'Consider pointing kid to /dev/null or a static file whose content you control.',
        cost: 25,
        isUnlocked: false
      }
    ]
  },
  {
    id: 'ch-near-03',
    slug: 'neural-stegano',
    title: 'Weight Matrix Embedding',
    category: 'Crypto',
    difficulty: 'Hard',
    points: 300,
    source: 'NEAR.AI',
    author: 'NEAR.AI Research',
    description: `A quantized tiny vision model checkpoint was published with benign inference accuracy.
    
However, hidden telemetry data was embedded into the lowest-significant bits of specific attention projection matrices using parity encoding.
    
Extract the hidden bitstream and restore the encrypted payload.
    
*Contributed by NEAR.AI.*`,
    solvesCount: 8,
    isSolved: false,
    files: [
      {
        name: 'model_quant_weights.safetensors',
        size: '14.8 MB',
        sha256: '77889900aabbccddeeff00112233445566778899aabbccddeeff001122334455',
        downloadUrl: '#mock-download'
      }
    ],
    hints: [
      {
        id: 'h-near-03-1',
        order: 1,
        content: 'Examine layer 3 and layer 7 query projection weights specifically.',
        cost: 30,
        isUnlocked: false
      }
    ]
  },
  {
    id: 'ch-pwn-02',
    slug: 'heap-unlink-26',
    title: 'Safe Unlink Dilemma',
    category: 'Pwn',
    difficulty: 'Insane',
    points: 450,
    source: 'ACM',
    author: 'ACM Systems Group',
    description: `An allocation engine incorporates an older dlmalloc derivative compiled without double-free guards.
    
Leverage an off-by-one null byte overwrite across adjacent chunk boundaries to trigger an overlapping chunk condition and gain arbitrary write capability.`,
    solvesCount: 3,
    isSolved: false,
    target: {
      id: 'inst-pwn-02',
      host: 'heaplab.acm.internal',
      port: 7777,
      protocol: 'tcp',
      status: 'stopped'
    },
    hints: []
  },
  {
    id: 'ch-forensics-02',
    slug: 'memory-lane',
    title: 'Memory Lane',
    category: 'Forensics',
    difficulty: 'Medium',
    points: 225,
    source: 'ACM',
    author: 'Digital Forensics Lab',
    description: `An operational memory dump from an incident response triage capture is provided.
    
Use Volatility 3 or manual page table traversal to identify the injected DLL inside an unmapped memory region and dump the decapsulation routine.`,
    solvesCount: 16,
    isSolved: false,
    files: [
      {
        name: 'memdump_triage.vmem.gz',
        size: '64.1 MB',
        sha256: '3344556677889900aabbccddeeff0011223344556677889900aabbccddeeff00',
        downloadUrl: '#mock-download'
      }
    ],
    hints: [
      {
        id: 'h-forensics-02-1',
        order: 1,
        content: 'Check the malfind and vadinfo volatility plugins on process svchost.exe (PID 1420).',
        cost: 25,
        isUnlocked: false
      }
    ]
  },
  {
    id: 'ch-rev-02',
    slug: 'vm-obfuscator',
    title: 'Virtual Opcode Runner',
    category: 'Reverse Engineering',
    difficulty: 'Hard',
    points: 325,
    source: 'ACM',
    author: 'Binary Analysis Team',
    description: `A custom bytecode interpreter executes proprietary instructions simulating an 8-register accumulator architecture.
    
Reverse the instruction dispatch table, write a disassembler for the bytecode payload, and solve the constraint equations to retrieve the flag.`,
    solvesCount: 7,
    isSolved: false,
    files: [
      {
        name: 'custom_vm_runner',
        size: '56.3 KB',
        sha256: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
        downloadUrl: '#mock-download'
      },
      {
        name: 'bytecode.bin',
        size: '4.8 KB',
        sha256: '123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
        downloadUrl: '#mock-download'
      }
    ],
    hints: []
  },
  {
    id: 'ch-misc-01',
    slug: 'hardware-logic-glitch',
    title: 'Logic Trace Tap',
    category: 'Miscellaneous',
    difficulty: 'Easy',
    points: 100,
    source: 'ACM',
    author: 'ACM Embedded SIG',
    description: `A digital logic analyzer capture from a microcontroller SPI bus contains decoded sensor communication.
    
Parse the saleae logic capture file, filter chip select pulses, and decode the transmitted serial flag data.`,
    solvesCount: 34,
    isSolved: false,
    files: [
      {
        name: 'spi_capture_24mhz.sal',
        size: '1.8 MB',
        sha256: '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
        downloadUrl: '#mock-download'
      }
    ],
    hints: [
      {
        id: 'h-misc-01-1',
        order: 1,
        content: 'Data is sampled on the falling clock edge (CPOL=0, CPHA=1).',
        cost: 15,
        isUnlocked: false
      }
    ]
  }
]

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    prevRank: 1,
    teamId: 'team-01',
    teamName: 'ByteBandits',
    score: 1350,
    solvesCount: 8,
    lastSolveTime: '18 mins ago',
    membersCount: 4,
    isCurrentTeam: false,
    scoreTimeline: [
      { minuteOffset: 30, score: 200 },
      { minuteOffset: 65, score: 450 },
      { minuteOffset: 110, score: 800 },
      { minuteOffset: 155, score: 1100 },
      { minuteOffset: 210, score: 1350 }
    ]
  },
  {
    rank: 2,
    prevRank: 3,
    teamId: 'team-02',
    teamName: 'NullPointer',
    score: 1225,
    solvesCount: 7,
    lastSolveTime: '24 mins ago',
    membersCount: 4,
    isCurrentTeam: false,
    scoreTimeline: [
      { minuteOffset: 25, score: 100 },
      { minuteOffset: 70, score: 350 },
      { minuteOffset: 125, score: 700 },
      { minuteOffset: 180, score: 975 },
      { minuteOffset: 205, score: 1225 }
    ]
  },
  {
    rank: 3,
    prevRank: 2,
    teamId: 'team-03',
    teamName: 'KernelPanic',
    score: 1100,
    solvesCount: 6,
    lastSolveTime: '42 mins ago',
    membersCount: 3,
    isCurrentTeam: false,
    scoreTimeline: [
      { minuteOffset: 40, score: 200 },
      { minuteOffset: 85, score: 500 },
      { minuteOffset: 140, score: 850 },
      { minuteOffset: 190, score: 1100 }
    ]
  },
  {
    rank: 4,
    prevRank: 5,
    teamId: 'team-me',
    teamName: 'RootAccess',
    score: 975,
    solvesCount: 5,
    lastSolveTime: '32 mins ago',
    membersCount: 4,
    isCurrentTeam: true,
    scoreTimeline: [
      { minuteOffset: 15, score: 100 },
      { minuteOffset: 45, score: 200 },
      { minuteOffset: 95, score: 475 },
      { minuteOffset: 145, score: 750 },
      { minuteOffset: 198, score: 975 }
    ]
  },
  {
    rank: 5,
    prevRank: 4,
    teamId: 'team-05',
    teamName: 'ZeroDayExploiters',
    score: 950,
    solvesCount: 5,
    lastSolveTime: '55 mins ago',
    membersCount: 4,
    isCurrentTeam: false,
    scoreTimeline: [
      { minuteOffset: 35, score: 200 },
      { minuteOffset: 80, score: 450 },
      { minuteOffset: 130, score: 700 },
      { minuteOffset: 175, score: 950 }
    ]
  },
  {
    rank: 6,
    prevRank: 6,
    teamId: 'team-06',
    teamName: 'CipherSync',
    score: 725,
    solvesCount: 4,
    lastSolveTime: '1 hr ago',
    membersCount: 3,
    isCurrentTeam: false,
    scoreTimeline: [
      { minuteOffset: 50, score: 200 },
      { minuteOffset: 105, score: 425 },
      { minuteOffset: 160, score: 725 }
    ]
  },
  {
    rank: 7,
    prevRank: 8,
    teamId: 'team-07',
    teamName: 'BinaryRebels',
    score: 650,
    solvesCount: 4,
    lastSolveTime: '1 hr 12 mins ago',
    membersCount: 4,
    isCurrentTeam: false,
    scoreTimeline: [
      { minuteOffset: 45, score: 150 },
      { minuteOffset: 110, score: 400 },
      { minuteOffset: 150, score: 650 }
    ]
  },
  {
    rank: 8,
    prevRank: 7,
    teamId: 'team-08',
    teamName: 'StackSmashers',
    score: 550,
    solvesCount: 3,
    lastSolveTime: '1 hr 35 mins ago',
    membersCount: 3,
    isCurrentTeam: false,
    scoreTimeline: [
      { minuteOffset: 40, score: 100 },
      { minuteOffset: 90, score: 300 },
      { minuteOffset: 135, score: 550 }
    ]
  },
  {
    rank: 9,
    prevRank: 9,
    teamId: 'team-09',
    teamName: 'GhidraGurus',
    score: 475,
    solvesCount: 3,
    lastSolveTime: '2 hrs ago',
    membersCount: 4,
    isCurrentTeam: false,
    scoreTimeline: [
      { minuteOffset: 35, score: 100 },
      { minuteOffset: 85, score: 275 },
      { minuteOffset: 120, score: 475 }
    ]
  },
  {
    rank: 10,
    prevRank: 10,
    teamId: 'team-10',
    teamName: 'ProtocolRangers',
    score: 400,
    solvesCount: 2,
    lastSolveTime: '2 hrs 10 mins ago',
    membersCount: 2,
    isCurrentTeam: false,
    scoreTimeline: [
      { minuteOffset: 50, score: 200 },
      { minuteOffset: 110, score: 400 }
    ]
  }
]

export const MOCK_CURRENT_USER: User = {
  id: 'usr-01',
  username: 'alex_c',
  displayName: 'Alex Chen',
  email: 'alex.chen@student.acm.org',
  role: 'participant',
  teamId: 'team-me',
  teamName: 'RootAccess',
  isTeamCaptain: true,
  score: 975,
  solvedCount: 5,
  createdAt: '2026-10-01T10:00:00Z'
}

export const MOCK_CURRENT_TEAM: Team = {
  id: 'team-me',
  name: 'RootAccess',
  rank: 4,
  score: 975,
  inviteCode: 'ROOT-9924-ACM',
  members: [
    {
      id: 'usr-01',
      username: 'alex_c',
      displayName: 'Alex Chen (You)',
      isCaptain: true,
      solvesCount: 2,
      pointsContributed: 425,
      joinedAt: '3 days ago'
    },
    {
      id: 'usr-02',
      username: 'sam_k',
      displayName: 'Sam K.',
      isCaptain: false,
      solvesCount: 1,
      pointsContributed: 200,
      joinedAt: '2 days ago'
    },
    {
      id: 'usr-03',
      username: 'elena_v',
      displayName: 'Elena Voronova',
      isCaptain: false,
      solvesCount: 1,
      pointsContributed: 250,
      joinedAt: '2 days ago'
    },
    {
      id: 'usr-04',
      username: 'devon_t',
      displayName: 'Devon T.',
      isCaptain: false,
      solvesCount: 1,
      pointsContributed: 100,
      joinedAt: '1 day ago'
    }
  ],
  solves: [
    {
      challengeId: 'ch-web-01',
      challengeTitle: 'Forgotten Door',
      category: 'Web',
      points: 100,
      solvedAt: '2026-10-08T14:45:00Z',
      solvedByUsername: 'devon_t'
    },
    {
      challengeId: 'ch-crypto-01',
      challengeTitle: 'Broken Cipher',
      category: 'Crypto',
      points: 100,
      solvedAt: '2026-10-08T14:15:00Z',
      solvedByUsername: 'alex_c'
    },
    {
      challengeId: 'ch-forensics-01',
      challengeTitle: 'Ghost in the Metadata',
      category: 'Forensics',
      points: 100,
      solvedAt: '2026-10-08T14:30:00Z',
      solvedByUsername: 'sam_k'
    },
    {
      challengeId: 'ch-rev-01',
      slug: 'dead-packet',
      challengeTitle: 'Dead Packet',
      category: 'Reverse Engineering',
      points: 200,
      solvedAt: '2026-10-08T15:20:00Z',
      solvedByUsername: 'alex_c'
    },
    {
      challengeId: 'ch-osint-01',
      challengeTitle: 'Orbital Beacon',
      category: 'OSINT',
      points: 175,
      solvedAt: '2026-10-08T15:52:00Z',
      solvedByUsername: 'elena_v'
    }
  ],
  createdAt: '2026-10-02T12:00:00Z'
}

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-01',
    title: 'CTF Competition Is Now Officially Live',
    content: 'The 6-hour competition clock has started. Challenges in Web, Crypto, Forensics, OSINT, Reverse Engineering, Pwn, and the NEAR.AI track are unlocked. Good luck to all teams.',
    priority: 'urgent',
    category: 'general',
    timestamp: '2 hours 18 mins ago',
    author: 'ACM Head Organizer',
    isRead: true
  },
  {
    id: 'ann-02',
    title: 'Target Instance Deployment Notice',
    content: 'Each team is allocated one active concurrent instance container for Web and Pwn challenge targets. Containers run for a 45-minute TTL and can be renewed if needed.',
    priority: 'update',
    category: 'infrastructure',
    timestamp: '1 hour 45 mins ago',
    author: 'Infra Lead',
    isRead: true
  },
  {
    id: 'ann-03',
    title: 'Clarification on NEAR.AI Model Evaluator',
    content: 'For the "Model Guardrail Bypass" challenge, prompt submissions are rate-limited to 6 per minute per team to preserve evaluation compute quotas.',
    priority: 'info',
    category: 'challenges',
    timestamp: '52 mins ago',
    author: 'NEAR.AI Mentor',
    isRead: false
  },
  {
    id: 'ann-04',
    title: 'First Blood on "Dead Packet"',
    content: 'Team "ByteBandits" has claimed first blood on Dead Packet (+200 pts) at 15:02:11 UTC.',
    priority: 'info',
    category: 'challenges',
    timestamp: '35 mins ago',
    author: 'CTF Bot',
    isRead: false
  }
]
