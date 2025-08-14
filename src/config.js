export const LS_KEY='mainplot_v40_state';

export const DEFAULT_OPTS={
  continue:{ length:'medium', tempo:'steady' },
  rewrite:{ strength:'medium', focus:'voice' },
  expand:{ size:'para', focus:'emotion' },
  conflict:{ type:'interpersonal', intensity:'moderate' },
  describe:{ mode:'cinematic', focus:'mixed' },
  summarize:{ format:'bullets', scope:'scene' },
  brainstorm:{ count:'5', spice:'fresh' }
};

export const OPTION_SPECS={
  continue:{
    length:[['short','2–3 paragraphs'],['medium','3–5 paragraphs'],['long','~600 words']],
    tempo:[['steady','Steady'],['brisk','Brisk'],['lingering','Lingering']]
  },
  rewrite:{
    strength:[['light','Light polish'],['medium','On‑voice rewrite'],['bold','Bold rewrite']],
    focus:[['voice','Voice'],['clarity','Clarity'],['pacing','Pacing']]
  },
  expand:{
    size:[['sentences','+3–5 sentences'],['para','+1–2 paragraphs']],
    focus:[['emotion','Emotion'],['setting','Setting'],['action','Action']]
  },
  conflict:{
    type:[['internal','Internal'],['interpersonal','Interpersonal'],['external','External']],
    intensity:[['subtle','Subtle'],['moderate','Moderate'],['high','High']]
  },
  describe:{
    mode:[['cinematic','Cinematic'],['intimate','Intimate'],['objective','Objective']],
    focus:[['visual','Visual'],['auditory','Auditory'],['mixed','Mixed']]
  },
  summarize:{
    format:[['bullets','Bullets'],['paragraph','Paragraph']],
    scope:[['scene','Scene'],['chapter','Chapter']]
  },
  brainstorm:{
    count:[['3','3 ideas'],['5','5 ideas'],['8','8 ideas']],
    spice:[['safe','Safe'],['fresh','Fresh'],['wild','Wild']]
  }
};
