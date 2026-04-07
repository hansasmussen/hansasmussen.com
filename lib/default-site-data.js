export const defaultSiteData = {
  content: {
    homeManifesto:
      "A modern-day drifter, chasing photons like they owe rent - Dust on the lens, a roll of film on the ready. Out here, it’s light and motion. A filmic fever dream with digital echoes. Every click a whispered prayer to the gods of grain. Whether it’s celluloid or silicon, the chase stays the same: you, the light, and the beautiful mess in between.",
    workManifesto:
      "The frame slows things down. A glance lingers, becomes something more. A bent sign, a flicker of symmetry, two strangers sharing a silent moment. The unnoticed comes into focus - Quiet tension. There’s a logic to the disorder, If you’re patient, it appears… then it’s gone.",
    contactHeader: "Let's not make it complicated.",
    contactBody:
      "I'm a fashion and lifestyle photographer based in Denmark, working across Europe chasing light, strong ideas, and honest visuals. I'm also part owner of PS Content, a full-service content production agency.\n\nWhether it's a campaign, a concept, or something in-between, you're welcome to get in touch directly through this portfolio or contact my booking manager, Amalie Danscher Asmussen.\n\nIf it feels right, it probably is. Say something.",
    printsHeader: "Selected works available as prints.",
    printsBody:
      "A curated selection of images available in small editions and printed on carefully chosen paper. Sizes and stock vary from work to work.",
    printPaperOptions: [],
    printSizeOptions: [],
  },
  portfolioItems: [
    {
      title: "BW Portrait",
      year: "2025",
      src: "/assets/test-set/bw-portrait.jpg",
      alt: "Sort-hvid portrait",
      focus: "center",
      projectSlug: "bw-portrait",
      featured: false,
    },
    {
      title: "Nielsen's Herre",
      year: "2025",
      src: "/assets/test-set/nielsens-herre.jpg",
      alt: "Portrait fra Nielsen's herreserie",
      focus: "center",
      projectSlug: "nielsens-series",
      featured: false,
    },
    {
      title: "AW 2613082",
      year: "2025",
      src: "/assets/test-set/aw2613082.jpg",
      alt: "Bredt editorial billede",
      span: "wide",
      focus: "center",
      projectSlug: "aw-2613082",
      journalSlug: "aw-2613082-light-notes",
      featured: true,
    },
    {
      title: "Portrait 07494",
      year: "2025",
      src: "/assets/test-set/portrait-07494.jpg",
      alt: "Langt portrait i hojformat",
      focus: "center",
      projectSlug: "bw-portrait",
      featured: false,
    },
    {
      title: "Nielsen's Dame",
      year: "2025",
      src: "/assets/test-set/nielsens-dame.jpg",
      alt: "Portrait fra Nielsen's dameserie",
      focus: "center",
      projectSlug: "nielsens-series",
      featured: true,
    },
    {
      title: "Simply 43635",
      year: "2025",
      src: "/assets/test-set/simply43635.jpg",
      alt: "Portrait i hojformat",
      focus: "center",
      projectSlug: "simply-43635",
      featured: true,
    },
    {
      title: "Perfect Jeans",
      year: "2025",
      src: "/assets/test-set/perfectjeans.jpg",
      alt: "Bredt campaign billede",
      span: "wide",
      focus: "center",
      projectSlug: "perfect-jeans",
      featured: true,
    },
    {
      title: "Numph HS",
      year: "2025",
      src: "/assets/test-set/numph-hs.jpg",
      alt: "Portrait fra Numph serie",
      focus: "center",
      projectSlug: "numph-high-summer",
      featured: false,
    },
    {
      title: "Gossia Lookbook",
      year: "2025",
      src: "/assets/test-set/gossia-lookbook.jpg",
      alt: "Portrait fra lookbook",
      focus: "center",
      projectSlug: "gossia-lookbook",
      featured: false,
    },
    {
      title: "NMPH Summer",
      year: "2025",
      src: "/assets/test-set/nmph-summer.jpg",
      alt: "Bredt sommerbillede",
      span: "wide",
      focus: "center",
      projectSlug: "numph-high-summer",
      featured: false,
    },
    {
      title: "Kenneth Kaalund Motion",
      year: "2025",
      src: "/assets/test-set/kennethkaalund.mp4",
      alt: "Motion portrait video",
      mediaType: "video",
      focus: "center",
      projectSlug: "kenneth-kaalund-motion",
      journalSlug: "kenneth-kaalund-motion-notes",
      featured: false,
    },
  ],
  projects: [
    {
      slug: "aw-2613082",
      title: "AW 2613082",
      summary: "Cold editorial light with a calm frame and a little distance.",
      technicalDetails: "Camera: Leica SL2-S\nLens: 50mm\nLight: Natural window light\nFormat: Digital",
      body:
        "A restrained editorial series built around space, quiet styling and a cool tonal palette. The idea was to keep the frame clean enough that posture and expression did most of the work.",
      media: [
        { src: "/assets/test-set/aw2613082.jpg", alt: "AW 2613082 hero", mediaType: "image", span: "wide" },
        { src: "/assets/test-set/aw2614371.jpg", alt: "AW 2614371 portrait", mediaType: "image" },
        { src: "/assets/test-set/portrait-07494.jpg", alt: "Portrait detail", mediaType: "image" }
      ],
      journalSlug: "aw-2613082-light-notes",
    },
    {
      slug: "nielsens-series",
      title: "Nielsen's Series",
      summary: "Two portraits from the same visual family, held together by tone and pace.",
      technicalDetails: "Camera: Sony A7R IV\nLens: 85mm\nLight: Soft daylight + negative fill",
      body:
        "A portrait-led fashion series where the intention was to keep the styling readable while letting expression carry the frame. The edit stays gentle and slightly understated.",
      media: [
        { src: "/assets/test-set/nielsens-herre.jpg", alt: "Nielsen's Herre", mediaType: "image" },
        { src: "/assets/test-set/nielsens-dame.jpg", alt: "Nielsen's Dame", mediaType: "image" }
      ]
    },
    {
      slug: "kenneth-kaalund-motion",
      title: "Kenneth Kaalund Motion",
      summary: "A moving portrait study where stillness and motion sit in the same frame.",
      technicalDetails: "Camera: Sony FX3\nLens: 35mm\nLight: Available light\nSound: Off by default",
      body:
        "This project mixes still photographic framing with subtle motion. The intention was to let the clip behave like an image first, and only then reveal that it moves.",
      media: [
        { src: "/assets/test-set/kennethkaalund.mp4", alt: "Kenneth Kaalund motion portrait", mediaType: "video" },
        { src: "/assets/test-set/bw-portrait.jpg", alt: "Black and white companion portrait", mediaType: "image" }
      ],
      journalSlug: "kenneth-kaalund-motion-notes",
    }
  ],
  journalPosts: [
    {
      slug: "aw-2613082-light-notes",
      title: "How AW 2613082 Was Lit",
      excerpt: "A quiet setup where the window did most of the talking.",
      body:
        "The frame was built around restraint. Instead of adding more light, the setup used one existing window and then shaped contrast by taking light away. That gave the skin enough texture and kept the styling from looking over-polished. The final image works because the setup stayed simple long enough for the subject to settle into it.",
      relatedProjectSlug: "aw-2613082",
    },
    {
      slug: "kenneth-kaalund-motion-notes",
      title: "Why This Portrait Became Motion",
      excerpt: "The image started as a still and only later demanded movement.",
      body:
        "The original intention was to make a still portrait, but the subject's rhythm in front of the camera suggested something slightly more alive. By keeping the motion understated, the clip still behaves like a photograph in the grid while offering more depth when you step inside the project.",
      relatedProjectSlug: "kenneth-kaalund-motion",
    }
  ],
  contact: [
    {
      label: "Email",
      value: "hello@hansasmussen.com",
      href: "mailto:hello@hansasmussen.com",
    },
    {
      label: "Instagram",
      value: "@hansasmussen",
      href: "https://www.instagram.com/hansasmussen",
    },
  ],
};
