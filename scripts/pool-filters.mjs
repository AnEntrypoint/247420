export const CATEGORIES = {
  'real-violence': /murder|ambush|shooting|shot dead|body[- ]?cam|dashcam|deputies|\bpolice\b|lethal|killed|manhunt|crime scene|autopsy|stabbing|homicide|massacre|hostage|execution|beheading|bodycam|assassin|\bguns?\b|\bbombs?\b|\bbombing\b/i,
  'war-atrocity-extremism': /nazi|hitler|third reich|wehrmacht|swastika|holocaust|genocide|gustloff|\bisis\b|terror|jihad|\bkkk\b|white power|supremacist/i,
  hate: /\bhate\b|racist|slur|superman cartoons|fleischer superman|\bjaps?\b|blackface|minstrel|darkie|golliwog/i,
  sexual: /porn|\bxxx\b|\bsex(ual|y)?\b|erotic|nude|naked|fetish|hentai|strip(per|tease)|nsfw|lingerie|bdsm|schwanz|ficken|\bfick|titten|muschi|wichs|\bhure\b|nutte|\bpussy|\bcunt|fuck|\bcock\b|blowjob|penis|vagina|boobs|\bdick\b|\bcum\b|\banal\b/i,
  'gore-self-harm': /\bgore\b|\bgory\b|snuff|corpse|suicide|self[- ]harm|torture|mutilat|dismember|cadaver/i,
  harassment: /doxx|harass|stalker|revenge porn|swatting/i,
  tragedy: /tragedy|victims?\b|funeral|died in/i,
};

export const DENY = {
  religion: /\bpray(er|ers|ing)?\b|mosque|church|sermon|\bmass\b|quran|koran|bible|hymn|gospel|ramadan|\bimam\b|pastor|worship|christian|islamic|jesus|\bgod\b|sunday school|evangeli|ministry|catholic|synagogue|buddhis[tm]|scripture|\bchrist\b|\bfaith\b|\bmuslim|\bmissionar/i,
  'news-politics': /\bnews\b|election|\bspeech\b|press conference|parliament|\brally\b|\bpresident|\bsenate\b|congress|\bcampaign\b|politic|government|\bminister\b|protest|newsreel|broadcast of/i,
  'lectures-talks': /\blectures?\b|\btalks?\b|\bpanel\b|seminar|symposium|keynote|webinar|tutorial|\bcourses?\b|colloquium|opencourseware|commencement|\bclass\b|\blesson\b|how to\b/i,
  conference: /conference|\bsummit\b|convention|workshop|proceedings|\bfestival\b/i,
  interview: /interview|\bq&a\b|in conversation|podcast|\bdiscussion\b/i,
  'local-event': /ceremony|\bparade\b|graduation|wedding|funeral|memorial|town hall|council|dedication|commemorat|\bconcert\b|recital/i,
  travelogue: /travelogue|\btravel\b|tour of|trip to|walking tour|city tour|vacation|holiday in|journey through|sightseeing|\bvisiting\b/i,
  'military-war': /\bwar\b|wwii|world war|military|\barmy\b|\bnavy\b|soldiers?\b|\bbattle\b|troops|combat|veterans?\b|air force|marines|weapons?\b|missile|pentagon|armed forces|\bnato\b/i,
  medical: /surg(ery|ical)|\bpatients?\b|medical|hospital|anatomy|clinical|disease|therapy|dental|cancer|\bnurse|physician|health care/i,
  courtroom: /courtroom|\btrial\b|\bjudge\b|testimony|\bhearing\b|lawsuit|supreme court/i,
  'home-video': /home movies?|family video|birthday party|\bbaby\b|camcorder|vlog|day in the life|family reunion|christmas morning|amateur film/i,
  sports: /\bmatch\b|football|soccer|basketball|baseball|hockey|tennis|\bgolf\b|olympic|\bnfl\b|\bnba\b|championship|super bowl|world cup|\bleague\b/i,
  'bland-compilation': /compilation|\bcollection\b|\bvarious\b|\bmisc\b|untitled|unlisted|all animated movies|best movies ever|full series|complete series|\bseason \d+\b|archive of|\bepisodes?\b/i,
};
