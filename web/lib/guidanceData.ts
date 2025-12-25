export type GuidanceContent = {
    title: string;
    icon: string;
    color: string;
    dos: string[];
    donts: string[];
    instructions: string[];
};

export const GUIDANCE_DATA: Record<string, GuidanceContent> = {
    fire: {
        title: 'Fire Emergency',
        icon: '🔥',
        color: 'text-orange-600',
        dos: [
            'Stay low to the ground to avoid smoke.',
            'Check doors for heat before opening.',
            'Cover your nose and mouth with a wet cloth.'
        ],
        donts: [
            'Do not use elevators.',
            'Do not hide in closets or under beds.',
            'Do not return to the building until cleared.'
        ],
        instructions: [
            'Evacuate immediately using the nearest exit.',
            'If trapped, seal door gaps with cloth.',
            'Signal for help from a window if possible.'
        ]
    },
    medical: {
        title: 'Medical Emergency',
        icon: '🚑',
        color: 'text-blue-600',
        dos: [
            'Check for breathing and pulse.',
            'Keep the patient warm and comfortable.',
            'Clear the area for responders.'
        ],
        donts: [
            'Do not move the patient unless necessary.',
            'Do not give food or water if unconscious.',
            'Do not leave the patient alone.'
        ],
        instructions: [
            'Perform CPR if trained and necessary.',
            'Apply pressure to bleeding wounds.',
            'Wait for the ambulance.'
        ]
    },
    accident: {
        title: 'Road Accident',
        icon: '🚗',
        color: 'text-red-600',
        dos: [
            'Turn on hazard lights.',
            'Check for injuries.',
            'Move to safety if the vehicle is dangerous.'
        ],
        donts: [
            'Do not move injured persons unless in danger.',
            'Do not remove helmets from bikers.',
            'Do not leave the scene.'
        ],
        instructions: [
            'Call emergency services immediately.',
            'Warn other drivers.',
            'Provide first aid if capable.'
        ]
    },
    violence: {
        title: 'Violence / Threat',
        icon: '👊',
        color: 'text-purple-600',
        dos: [
            'Hide in a secure, lockable room.',
            'Silence your phone.',
            'Keep calm and quiet.'
        ],
        donts: [
            'Do not confront the attacker.',
            'Do not make sudden movements.',
            'Do not draw attention to yourself.'
        ],
        instructions: [
            'Barricade doors if possible.',
            'Call police when safe.',
            'Wait for "All Clear" signal.'
        ]
    },
    disaster: {
        title: 'Natural Disaster',
        icon: '🌪️',
        color: 'text-slate-600',
        dos: [
            'Listen to local news and weather reports.',
            'Move to higher ground if flooding.',
            'Stay away from windows during storms.'
        ],
        donts: [
            'Do not drive through flooded areas.',
            'Do not use open flames.',
            'Do not touch fallen power lines.'
        ],
        instructions: [
            'Follow evacuation orders immediately.',
            'Locate your emergency kit.',
            'Check on neighbors if safe.'
        ]
    },
    other: {
        title: 'General Emergency',
        icon: '⚠️',
        color: 'text-neutral-600',
        dos: [
            'Stay calm.',
            'Follow official instructions.',
            'Help others if safe to do so.'
        ],
        donts: [
            'Do not spread unverified rumors.',
            'Do not panic.'
        ],
        instructions: [
            'Contact local authorities.',
            'Move to a safe location.'
        ]
    }
};
