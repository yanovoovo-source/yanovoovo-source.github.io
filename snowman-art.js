/* A small snow sculpture: shared geometry, with independently dressable layers. */
const JIANGHU_SNOWMAN_ART = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 142" fill="none" focusable="false">
    <defs>
        <radialGradient id="guest-snow" cx=".28" cy=".2" r=".88"><stop stop-color="#fffdf5"/><stop offset=".48" stop-color="#ebe7e2"/><stop offset=".84" stop-color="#c7c1c8"/><stop offset="1" stop-color="#aaa3b1"/></radialGradient>
        <radialGradient id="guest-head" cx=".3" cy=".22" r=".86"><stop stop-color="#fffef8"/><stop offset=".58" stop-color="#eee9e4"/><stop offset="1" stop-color="#bdb5c1"/></radialGradient>
        <linearGradient id="guest-ivory" x1=".1" y1="0" x2=".95" y2="1"><stop stop-color="#f1e7d5"/><stop offset=".5" stop-color="#d9d5d7"/><stop offset="1" stop-color="#8d8799"/></linearGradient>
        <linearGradient id="guest-ink" x1="0" y1="0" x2="1" y2=".9"><stop stop-color="#60565e"/><stop offset=".35" stop-color="#302c37"/><stop offset="1" stop-color="#171722"/></linearGradient>
        <linearGradient id="guest-straw" x1=".2" y1="0" x2=".8" y2="1"><stop stop-color="#d7bd8b"/><stop offset=".45" stop-color="#a38a61"/><stop offset="1" stop-color="#5e4b3b"/></linearGradient>
        <linearGradient id="guest-wine" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a36960"/><stop offset=".45" stop-color="#78443f"/><stop offset="1" stop-color="#402b32"/></linearGradient>
        <linearGradient id="guest-carrot" x1="0" y1="0" x2=".2" y2="1"><stop stop-color="#e7b47c"/><stop offset=".55" stop-color="#c58450"/><stop offset="1" stop-color="#8f5439"/></linearGradient>
        <radialGradient id="guest-cheek"><stop stop-color="#c58d80" stop-opacity=".32"/><stop offset="1" stop-color="#c58d80" stop-opacity="0"/></radialGradient>
        <pattern id="guest-grain" width="11" height="13" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".5" fill="#837b8d" opacity=".22"/><circle cx="8" cy="8" r=".6" fill="#fff" opacity=".85"/><circle cx="4" cy="11" r=".35" fill="#fff"/></pattern>
    </defs>
    <ellipse cx="56" cy="134" rx="40" ry="6" fill="#0e0b16" opacity=".27"/>
    <ellipse cx="54" cy="132" rx="31" ry="4" fill="#eee9e5" opacity=".55"/>
    <g stroke="#665244" stroke-width="2.4" stroke-linecap="round"><path d="M28 83 10 67 5 57M10 67 3 66M84 84 101 69 106 58M101 69 109 68"/><path d="m17 73-1-10m79 12 2-11" stroke-width="1.6"/></g>
    <g class="pet-outfit pet-outfit-swordsman"><path d="m93 58-8 65" stroke="#27242e" stroke-width="7" stroke-linecap="round"/><path d="m94 59-8 64" stroke="#8f7e70" stroke-width="1.2"/><path d="m93 56 2-15" stroke="#655451" stroke-width="4"/><path d="m88 54 13 2" stroke="#c9ac79" stroke-width="2.4" stroke-linecap="round"/></g>
    <path d="M30 73C18 79 12 100 18 116c5 17 23 20 42 19 20 0 35-7 36-23 2-16-5-33-18-39-14-7-34-8-48 0Z" fill="url(#guest-snow)"/>
    <path d="M30 73C18 79 12 100 18 116c5 17 23 20 42 19 20 0 35-7 36-23 2-16-5-33-18-39-14-7-34-8-48 0Z" fill="url(#guest-grain)" opacity=".65"/>
    <path d="M27 119c10 12 43 15 59 2" stroke="#fffdf7" stroke-opacity=".45" stroke-width="1.5" stroke-linecap="round"/>
    <g fill="#594f53"><ellipse cx="55" cy="94" rx="2.3" ry="2.6"/><ellipse cx="57" cy="110" rx="2.1" ry="2.5"/></g>
    <g class="pet-outfit pet-outfit-moon">
        <path d="M35 68C25 77 20 102 19 123q13 12 30 9l6-56 7 56q19 1 32-10C91 97 87 78 76 68l-21 4Z" fill="url(#guest-ivory)"/>
        <path d="M36 73q-8 27-10 49m49-48q9 23 12 47M55 78l-6 52m13-51 1 51" stroke="#817b8b" stroke-opacity=".36" stroke-width="1.2"/>
        <path d="M34 69 49 82l6-9 8 9 15-13" stroke="#f7eddc" stroke-width="4" stroke-linejoin="round"/>
        <path d="m48 83 15 1" stroke="#b3986b" stroke-width="1.4"/><circle cx="56" cy="84" r="2" fill="#d3bb8e"/>
    </g>
    <g class="pet-outfit pet-outfit-swordsman">
        <path d="M34 69C24 78 20 103 20 124q16 13 35 9 21 3 39-10C92 100 87 77 76 69l-21 4Z" fill="url(#guest-ink)"/>
        <path d="m38 73 17 20 20-20-12 33 4 24" stroke="#8a7a7b" stroke-opacity=".5" stroke-width="2"/>
        <path d="M27 99q29 7 61-1l-1 6q-29 7-60 0Z" fill="#8d4840"/><path d="m63 104-2 21 7-5-1-16" fill="#a45a49"/>
        <path d="M29 116q25 9 56 2" stroke="#8d7a69" stroke-opacity=".36"/>
    </g>
    <g class="pet-outfit pet-outfit-traveler">
        <path d="M34 66 21 87l-7 35q19 13 42 7 23 7 43-8L89 86 77 66 55 72Z" fill="url(#guest-straw)"/>
        <g stroke-linecap="round"><path d="m36 72-14 48m20-47-11 52m18-51-8 53m14-51v52m8-52 7 52m0-54 12 51m-5-52 14 47" stroke="#deca9d" stroke-opacity=".5"/><path d="m31 82-9 24m18-24-8 34m14-30-4 31m18-31 3 36m6-39 8 32m-1-33 9 25" stroke="#4d3b2f" stroke-opacity=".4"/></g>
        <path d="M25 94q29 11 67-1M20 109q36 11 75-1" stroke="#735c42" stroke-opacity=".6" stroke-width="2"/>
    </g>
    <g class="pet-outfit pet-outfit-winter">
        <path d="M34 70C23 76 17 101 19 119q13 14 36 14 25 1 40-14C95 99 88 77 77 70l-21 5Z" fill="url(#guest-wine)"/>
        <path d="M30 84q25 10 53 0M25 99q31 10 63 0M24 114q31 10 63 0" stroke="#d09a87" stroke-opacity=".23" stroke-width="1.2"/>
        <path d="m56 78 1 51" stroke="#e1ceac" stroke-opacity=".6"/><g fill="#ddc6a3"><circle cx="57" cy="88" r="1.6"/><circle cx="57" cy="101" r="1.6"/><circle cx="57" cy="114" r="1.6"/></g>
        <path d="M23 122q30 16 68-1" stroke="#ece1ce" stroke-width="4" stroke-linecap="round"/>
    </g>
    <ellipse cx="55" cy="72" rx="21" ry="5" fill="#716372" opacity=".18"/>
    <path d="M30 45c0-16 10-27 25-27 16 0 28 11 28 27 1 17-10 28-27 28-16 0-27-10-26-28Z" fill="url(#guest-head)"/>
    <path d="M30 45c0-16 10-27 25-27 16 0 28 11 28 27 1 17-10 28-27 28-16 0-27-10-26-28Z" fill="url(#guest-grain)" opacity=".6"/>
    <path d="M36 31q8-10 20-9" stroke="#fffef8" stroke-width="2" stroke-opacity=".7" stroke-linecap="round"/>
    <ellipse cx="42" cy="52" rx="7" ry="4" fill="url(#guest-cheek)"/><ellipse cx="70" cy="52" rx="7" ry="4" fill="url(#guest-cheek)"/>
    <g class="pet-eyes" fill="#40383e"><ellipse cx="47" cy="44" rx="2" ry="2.5"/><ellipse cx="64" cy="44" rx="2.1" ry="2.6"/><g fill="#fff9eb" opacity=".65"><circle cx="46.6" cy="43.2" r=".55"/><circle cx="63.6" cy="43.2" r=".55"/></g></g>
    <path d="M51 57q6 4 12-1" stroke="#78616a" stroke-width="1.1" stroke-linecap="round"/>
    <g class="pet-carrot"><path d="M55 47q3-2 6 1l14 5-16 2q-5-1-4-8Z" fill="url(#guest-carrot)"/><path d="m61 49-1 4m5-2-1 2" stroke="#8e563c" stroke-opacity=".45" stroke-width=".7"/></g>
    <g class="pet-accessory-scarf"><path d="m69 71 10 1-1 30-5-3-5 3Z" class="pet-scarf-main"/><path d="m72 78 1 20" stroke="#fff" stroke-opacity=".14"/><path d="M31 64q24 8 49 0l1 8q-26 10-50 0Z" class="pet-scarf-main"/><path d="M33 66q23 7 45 0" stroke="#fff" stroke-opacity=".2" stroke-width="1.4"/><path d="M32 72q24 8 47 0" stroke="#311620" stroke-opacity=".3" stroke-width="1.6"/></g>
    <g class="pet-wool-cap"><path d="M29 29C29 13 40 8 54 9q23 0 28 21l-3 4-49 1Z" fill="url(#guest-wine)"/><path d="m37 16 1 11m7-14v13m8-14v14m8-13-1 14m8-11-1 12m7-8-1 9" stroke="#d8b4a0" stroke-opacity=".3" stroke-width="1.1"/><circle cx="74" cy="13" r="5.5" fill="#e9deca"/><path d="M29 32q25-6 52 0" stroke="#eee3d0" stroke-width="6" stroke-linecap="round"/><path d="M31 30q24-5 47 0" stroke="#fff7e8" stroke-opacity=".65" stroke-width="1.5"/></g>
    <g class="pet-bamboo-accessory"><path d="M10 29 54 4l48 25q-42 14-92 0Z" fill="url(#guest-straw)"/><path d="M15 29q41 10 82 0" stroke="#4f3b2e" stroke-width="2"/><path d="m54 6-31 23M54 6 37 31M54 6l-3 27M54 6l13 26M54 6l27 24M54 6l39 21" stroke="#ead3a0" stroke-opacity=".36" stroke-width=".8"/><path d="M50 8q3-2 6 0" stroke="#f4e5c7" stroke-width="1.4"/><path d="M23 27q15-4 27-1" stroke="#f8f4eb" stroke-width="3" stroke-linecap="round" opacity=".8"/></g>
</svg>`;
