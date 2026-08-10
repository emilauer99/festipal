/* Festipal app — data, shared parts, all 13 screens and the app shell.
   Extracted verbatim from the offline Festipal bundle; App now takes
   initialTab / initialFestival so each screen can be mounted on its own. */
(function patchLucide(){
  const L = window.lucide;
  if (!L || !L.createIcons) { setTimeout(patchLucide, 20); return; }
  if (L.__fpDebounced) return;
  L.__fpDebounced = true;
  const orig = L.createIcons.bind(L);
  let queued = false;
  L.createIcons = function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; orig(); });
  };
})();
/* ---- data.jsx ---- */
(function(){
const FESTIVAL = { name: 'Nova Rise Festival', day: 'Sa · Tag 2', me: 'Lena Mayr', chip: 'NR-8842-K', balance: '48,50', social: ['instagram', 'tiktok', 'youtube', 'spotify'] };

const ACTS = [
  { time: '16:00', endTime: '17:00', artist: 'Halbmond', stage: 'Waldbühne', day: 'Sa', genre: 'Indie', friends: ['Sara Vogl'] },
  { time: '17:30', endTime: '18:45', artist: 'Tina Kranz', stage: 'Seezelt', day: 'Sa', genre: 'Pop', saved: true, friends: ['Ida Pfeil', 'Tim Reiter'] },
  { time: '19:00', endTime: '20:15', artist: 'Pferdeschau', stage: 'Mainstage', day: 'Sa', genre: 'Rock', friends: [] },
  { time: '21:30', endTime: '22:45', artist: 'Kellerkind', stage: 'Mainstage', day: 'Sa', genre: 'Techno', live: true, saved: true, friends: ['Jonas Klar', 'Sara Vogl', 'Tim Reiter'] },
  { time: '23:00', endTime: '00:15', artist: 'Mira Fluss', stage: 'Waldbühne', day: 'Sa', genre: 'House', conflict: true, saved: true, friends: ['Ida Pfeil'] },
  { time: '00:30', endTime: '02:00', artist: 'Nachtschicht b2b Oma', stage: 'Seezelt', day: 'Sa', genre: 'Techno', friends: ['Jonas Klar'] },
  { time: '15:00', endTime: '16:00', artist: 'Frühstückschor', stage: 'Seezelt', day: 'So', genre: 'Chor', friends: [] },
  { time: '18:00', endTime: '19:30', artist: 'Vier Farben', stage: 'Mainstage', day: 'So', genre: 'Indie', saved: true, friends: ['Sara Vogl', 'Milan Berg'] },
  { time: '14:00', endTime: '15:00', artist: 'Soundcheck offen', stage: 'Mainstage', day: 'Fr', genre: 'Open', friends: [] },
];

const STAGES = [
  { stage: 'Mainstage', now: 'Kellerkind', nowUntil: '22:45', progress: 62, next: 'Vier Farben', nextAt: '23:15' },
  { stage: 'Waldbühne', now: 'Halbmond', nowUntil: '22:20', progress: 41, next: 'Mira Fluss', nextAt: '23:00' },
  { stage: 'Seezelt', next: 'Nachtschicht b2b Oma', nextAt: '00:30' },
  { stage: 'Camp Stage', now: 'Offene Bühne', nowUntil: '23:30', progress: 18, next: 'Sara & Band', nextAt: '23:45' },
];

const NEWS = [
  { id: 1, kind: 'warning', time: 'vor 20 Min', unread: true, title: 'Gewitter ab 18 Uhr', body: 'Die Mainstage pausiert kurz. Geh bitte zurück zu den Zelten — wir melden uns, sobald es weitergeht.' },
  { id: 2, kind: 'lineup', time: 'vor 2 Std', unread: true, title: 'Kellerkind spielt eine Stunde länger', body: 'Aus dem 60-Minuten-Set werden 75. Der Rest vom Samstag verschiebt sich um 15 Minuten.' },
  { id: 3, kind: 'info', time: 'heute, 09:15', title: 'Wasserstellen bei C4 offen', body: 'Neue Trinkwasserstelle zwischen Camp Nord und dem Foodcourt. Flasche mitnehmen, Becher gibt es keine.' },
];

const GLOBAL_NEWS = [
  { id: 11, kind: 'lineup', time: 'vor 1 Std', unread: true, title: 'Kellerkind spielt vier Festivals im August', body: 'Nova Rise, Waldrand, Donaubeat und Hügelfest — alle Termine liegen jetzt in deinen Artists.' },
  { id: 12, kind: 'info', time: 'gestern', title: 'Cashless jetzt auf 12 Festivals', body: 'Dein Festipal-Guthaben funktioniert ab dieser Saison auch am Waldrand und beim Hügelfest.' },
];

const FRIENDS = [
  { name: 'Jonas Klar', at: 'Mainstage', distance: '120 m', presence: 'online' },
  { name: 'Ida Pfeil', status: 'Schläft noch im Zelt', distance: '450 m', presence: 'away' },
  { name: 'Tim Reiter', at: 'Foodcourt', distance: '210 m', presence: 'online' },
  { name: 'Sara Vogl', at: 'Camp Nord · C4', distance: '80 m', presence: 'online' },
  { name: 'Milan Berg', status: 'Kommt Samstag 14 Uhr an', presence: 'none' },
];

const FRIEND_REQUESTS = [
  { name: 'Nora Berger', status: 'Kennt dich vom Waldrand 2025' },
  { name: 'Elias Prem', status: '3 gemeinsame Freunde' },
];

const ACTIVITIES = [
  { id: 1, title: 'Sonnenuntergang am Hügel', time: 'Heute 20:40', place: 'Hügel hinter Camp Nord', host: 'Tim Reiter', going: ['Jonas Klar', 'Ida Pfeil', 'Sara Vogl'], spots: 5 },
  { id: 2, title: 'Frühstück & Kaffee kochen', time: 'Morgen 09:30', place: 'Camp Süd · S2', host: 'Jonas Klar', going: ['Sara Vogl', 'Milan Berg'], spots: 3 },
  { id: 3, title: 'Gemeinsam zu Mira Fluss', time: 'Heute 22:50', place: 'Treffpunkt Waldbühne links', host: 'Lena Mayr', going: ['Ida Pfeil'], spots: 8 },
];

const LISTINGS = [
  { id: 1, kind: 'tausch', title: 'Zeltplatz-Nachbarschaft', offers: '2 Plätze Camp Süd', wants: '2 Plätze Camp Nord', owner: 'Jonas Klar', area: 'Camp Süd · S2', distance: '6 Min' },
  { id: 2, kind: 'suche', title: 'Shuttle-Ticket Sonntag früh', offers: '15 € oder 2 Bier', wants: 'Shuttle 07:30 Richtung Bahnhof', owner: 'Ida Pfeil', area: 'Camp Nord · C1', distance: '3 Min' },
  { id: 3, kind: 'verschenkt', title: 'Halber Sack Grillkohle', offers: 'Kohle + Anzünder', wants: 'Nichts, einfach abholen', owner: 'Sara Vogl', area: 'Camp Nord · C4', distance: '2 Min' },
  { id: 4, kind: 'tausch', title: 'Camping-Upgrade', offers: 'Green Camping Stellplatz', wants: 'Standard + 30 €', owner: 'Milan Berg', area: 'Green Camping · G7', distance: '11 Min' },
];

const TX = [
  { label: 'Bar Waldbühne', detail: '2× Radler', amount: '−9,00', time: '21:04' },
  { label: 'Foodcourt · Kaskrainer', detail: 'Wurst mit Senf', amount: '−6,50', time: '19:48' },
  { label: 'Aufladung', detail: 'Apple Pay', amount: '+40,00', time: '17:12', positive: true },
  { label: 'Merch Container', detail: 'Shirt Nova Rise', amount: '−28,00', time: '15:33' },
];

const VENDORS = [
  { name: 'Kaskrainer Kurt', kind: 'Foodtruck', rating: 4.3, ratingCount: 128, distance: '90 m', wait: '4 Min', tags: ['vegetarisch'] },
  { name: 'Bar Waldbühne', kind: 'Bar', rating: 3.8, ratingCount: 214, distance: '140 m', wait: '11 Min' },
  { name: 'Curry Sisters', kind: 'Foodtruck', rating: 4.7, ratingCount: 96, distance: '210 m', wait: '6 Min', tags: ['vegan'] },
  { name: 'Merch Container', kind: 'Merch', rating: 4.0, ratingCount: 41, distance: '260 m' },
];

const FESTIVALS = [
  { id: 'nova', name: 'Nova Rise', dates: '31. Juli – 2. Aug 2026', place: 'Wiesen', status: 'angemeldet', ticket: 'Weekend + Camping', friends: 7, countdown: [{ value: '04', label: 'Tage' }, { value: '11', label: 'Std' }, { value: '38', label: 'Min' }] },
  { id: 'waldrand', name: 'Waldrand Open Air', dates: '21. – 23. Aug 2026', place: 'Mühlviertel', status: 'angemeldet', ticket: 'Weekend', friends: 4, countdown: [{ value: '26', label: 'Tage' }, { value: '03', label: 'Std' }] },
  { id: 'donaubeat', name: 'Donaubeat', dates: '11. – 12. Sep 2026', place: 'Linz', status: 'empfohlen', friends: 2 },
  { id: 'huegel', name: 'Hügelfest', dates: '25. – 27. Sep 2026', place: 'Steiermark', status: 'empfohlen', friends: 1 },
  { id: 'nova25', name: 'Nova Rise 2025', dates: '1. – 3. Aug 2025', place: 'Wiesen', status: 'vorbei' },
  { id: 'wald25', name: 'Waldrand 2025', dates: '22. – 24. Aug 2025', place: 'Mühlviertel', status: 'vorbei' },
];

const ARTISTS = [
  { name: 'Kellerkind', genre: 'Techno', nextFestival: 'Nova Rise', nextAt: 'Sa 21:30', upcoming: 4, following: true },
  { name: 'Mira Fluss', genre: 'House', nextFestival: 'Nova Rise', nextAt: 'Sa 23:00', upcoming: 2, following: true },
  { name: 'Vier Farben', genre: 'Indie', nextFestival: 'Waldrand', nextAt: 'Fr 20:00', upcoming: 3, following: true },
  { name: 'Tina Kranz', genre: 'Pop', nextFestival: 'Donaubeat', nextAt: 'Sa 19:00', upcoming: 1, following: true },
  { name: 'Halbmond', genre: 'Indie', nextFestival: 'Hügelfest', nextAt: 'So 17:30', following: false },
];

Object.assign(window, { FESTIVAL, ACTS, STAGES, NEWS, GLOBAL_NEWS, FRIENDS, FRIEND_REQUESTS, ACTIVITIES, LISTINGS, TX, VENDORS, FESTIVALS, ARTISTS });

})();
/* ---- parts.jsx ---- */
(function(){
const { Icon, Avatar } = window.FestipalDesignSystem_ee8ae6;

function SectionHead({ title, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
      <h3 style={{ font: 'var(--text-title-2)' }}>{title}</h3>
      {action && <button type="button" onClick={onAction} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--text-link)', font: 'var(--text-label)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>{action}<Icon name="chevron-right" size={14} /></button>}
    </div>
  );
}

/** Horizontal scroll rail that bleeds into the screen gutter. */
function Rail({ children, gap = 12 }) {
  return (
    <div className="fp-scroll" style={{ display: 'flex', gap, overflowX: 'auto', margin: '0 calc(-1 * var(--screen-pad))', padding: '0 var(--screen-pad)' }}>
      {children}
    </div>
  );
}

/** Stacked avatars of friends who saved / joined something. */
function FriendStack({ names = [], size = 22, label }) {
  if (!names.length) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span style={{ display: 'flex' }}>
        {names.slice(0, 3).map((n, i) => (
          <span key={n} style={{ marginLeft: i ? -7 : 0, borderRadius: 999, boxShadow: '0 0 0 2px var(--surface-card)' }}><Avatar name={n} size={size} /></span>
        ))}
      </span>
      <span style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>{label || (names.length + (names.length === 1 ? ' Freund' : ' Freunde'))}</span>
    </span>
  );
}
Object.assign(window, { SectionHead, Rail, FriendStack });

})();
/* ---- OverviewScreen.jsx ---- */
(function(){
const { FestivalCard, NewsCard, ArtistRow, SocialRow } = window.FestipalDesignSystem_ee8ae6;
const { Card, Button, Icon, Badge, Photo } = window.FestipalDesignSystem_ee8ae6;

function OverviewScreen({ go, openFestival }) {
  const { SectionHead, Rail } = window;
  const mine = window.FESTIVALS.filter((f) => f.status === 'angemeldet');
  const rec = window.FESTIVALS.filter((f) => f.status === 'empfohlen');
  const nextUp = mine[0];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      <div>
        <div style={{ font: 'var(--text-micro)', letterSpacing: 'var(--ls-caps)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Dein nächstes Festival</div>
        <FestivalCard {...nextUp} ratio="4 / 3" onClick={() => openFestival(nextUp)} />
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <Button fullWidth icon="arrow-right" onClick={() => openFestival(nextUp)}>Festival öffnen</Button>
          <Button variant="quiet" icon="qr-code" onClick={() => openFestival(nextUp)}>Ticket</Button>
        </div>
      </div>

      <div>
        <SectionHead title="Meine Festivals" action="Alle" onAction={() => go('festivals')} />
        <Rail>
          {mine.map((f) => (
            <div key={f.id} style={{ width: 268, flex: '0 0 auto' }}><FestivalCard {...f} onClick={() => openFestival(f)} /></div>
          ))}
        </Rail>
      </div>

      <div>
        <SectionHead title="Könnte dir gefallen" action="Mehr" onAction={() => go('festivals')} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rec.map((f) => <FestivalCard key={f.id} {...f} ratio="21 / 9" onClick={() => openFestival(f)} />)}
        </div>
      </div>

      <div>
        <SectionHead title="Deine Artists spielen bald" action="Alle" onAction={() => go('artists')} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {window.ARTISTS.filter((a) => a.following).slice(0, 3).map((a) => <ArtistRow key={a.name} {...a} />)}
        </div>
      </div>

      <div>
        <SectionHead title="News" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {window.GLOBAL_NEWS.map((n) => <NewsCard key={n.id} {...n} />)}
        </div>
      </div>

      <div>
        <SectionHead title="Festipal folgen" />
        <SocialRow links={['instagram', 'tiktok', 'youtube', 'web']} />
      </div>
    </div>
  );
}
Object.assign(window, { OverviewScreen });

})();
/* ---- MyFestivalsScreen.jsx ---- */
(function(){
const { FestivalCard } = window.FestipalDesignSystem_ee8ae6;
const { SegmentedControl, Input } = window.FestipalDesignSystem_ee8ae6;
const { Button, EmptyState, Icon, Card } = window.FestipalDesignSystem_ee8ae6;

function MyFestivalsScreen({ openFestival }) {
  const [tab, setTab] = React.useState('kommend');
  const list = window.FESTIVALS.filter((f) => tab === 'kommend' ? f.status !== 'vorbei' : f.status === 'vorbei');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SegmentedControl options={[{ value: 'kommend', label: 'Kommend' }, { value: 'vorbei', label: 'Vergangen' }]} value={tab} onChange={setTab} />
      <Input icon="search" placeholder="Festival suchen …" />
      {tab === 'kommend' && (
        <Card tone="brand" padding={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="ticket" size={18} color="var(--ci-primary)" />
            <div style={{ flex: 1 }}>
              <div style={{ font: 'var(--text-body-strong)' }}>2 Tickets in der Wallet</div>
              <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>Nova Rise und Waldrand sind bereit.</div>
            </div>
          </div>
        </Card>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((f) => <FestivalCard key={f.id} {...f} onClick={() => openFestival(f)} />)}
      </div>
      {!list.length && <EmptyState icon="tent" title="Noch keine Festivals" body="Sobald du ein Ticket hinzufügst, taucht das Festival hier auf." action={<Button size="sm" icon="plus">Ticket hinzufügen</Button>} />}
      <Button variant="quiet" icon="plus" fullWidth>Ticket oder Code hinzufügen</Button>
    </div>
  );
}
Object.assign(window, { MyFestivalsScreen });

})();
/* ---- MyArtistsScreen.jsx ---- */
(function(){
const { ArtistRow, SocialRow } = window.FestipalDesignSystem_ee8ae6;
const { Input, SegmentedControl } = window.FestipalDesignSystem_ee8ae6;
const { Tag, Button, Card, Icon, EmptyState, Sheet, Photo, Badge } = window.FestipalDesignSystem_ee8ae6;

function MyArtistsScreen() {
  const { SectionHead } = window;
  const [artists, setArtists] = React.useState(window.ARTISTS);
  const [genre, setGenre] = React.useState('Alle');
  const [open, setOpen] = React.useState(null);
  const genres = ['Alle', 'Techno', 'House', 'Indie', 'Pop'];
  const list = artists.filter((a) => genre === 'Alle' || a.genre === genre);
  const toggle = (name) => setArtists((prev) => prev.map((a) => a.name === name ? { ...a, following: !a.following } : a));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input icon="search" placeholder="Artist suchen …" />
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }} className="fp-scroll">
        {genres.map((g) => <Tag key={g} selected={genre === g} onClick={() => setGenre(g)}>{g}</Tag>)}
      </div>
      <Card tone="secondary" padding={14}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="bell-ring" size={18} color="var(--violet-300)" />
          <div style={{ flex: 1 }}>
            <div style={{ font: 'var(--text-body-strong)' }}>Push bei neuen Terminen</div>
            <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>Wir sagen dir, sobald ein Artist auf einem Festival landet.</div>
          </div>
        </div>
      </Card>
      <div>
        <SectionHead title="Folge ich" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.filter((a) => a.following).map((a) => <ArtistRow key={a.name} {...a} onToggleFollow={() => toggle(a.name)} onClick={() => setOpen(a)} />)}
        </div>
      </div>
      <div>
        <SectionHead title="Vorschläge" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.filter((a) => !a.following).map((a) => <ArtistRow key={a.name} {...a} onToggleFollow={() => toggle(a.name)} onClick={() => setOpen(a)} />)}
        </div>
      </div>
      {!list.length && <EmptyState icon="music-4" title="Keine Artists in diesem Genre" body="Probier einen anderen Filter." />}

      <Sheet open={!!open} title={open && open.name} onClose={() => setOpen(null)} footer={<Button fullWidth icon="bell-ring">Termine abonnieren</Button>}>
        {open && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Photo name={open.name} ratio="16 / 9" scrim>
              <div style={{ position: 'absolute', left: 14, bottom: 12 }}>
                <div style={{ font: 'var(--text-title-2)' }}>{open.name}</div>
                <div style={{ font: 'var(--text-body-sm)', color: 'var(--ink-100)' }}>{open.genre}</div>
              </div>
            </Photo>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[[open.nextFestival, open.nextAt], ['Waldrand Open Air', 'Sa 22:00'], ['Hügelfest', 'Fr 23:30']].map(([fe, at], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 'var(--r-sm)', background: 'var(--surface-inset)' }}>
                  <Icon name="calendar-clock" size={15} color="var(--text-muted)" />
                  <span style={{ flex: 1, font: 'var(--text-body-sm)' }}>{fe}</span>
                  <span style={{ font: 'var(--text-mono)', color: 'var(--text-secondary)' }}>{at}</span>
                </div>
              ))}
            </div>
            <SocialRow label="Hören" links={['spotify', 'youtube', 'instagram']} size={38} />
          </div>
        )}
      </Sheet>
    </div>
  );
}
Object.assign(window, { MyArtistsScreen });

})();
/* ---- FriendsScreen.jsx ---- */
(function(){
const { FriendRow } = window.FestipalDesignSystem_ee8ae6;
const { Input } = window.FestipalDesignSystem_ee8ae6;
const { IconButton, Button, Card, Icon, Avatar, Badge, Sheet } = window.FestipalDesignSystem_ee8ae6;

function FriendsScreen() {
  const { SectionHead } = window;
  const [invite, setInvite] = React.useState(false);
  const [handled, setHandled] = React.useState({});
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      <Input icon="search" placeholder="Freund oder @name suchen …" />

      <div>
        <SectionHead title="Anfragen" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {window.FRIEND_REQUESTS.map((r) => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
              <Avatar name={r.name} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: 'var(--text-body-strong)' }}>{r.name}</div>
                <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>{handled[r.name] === 'ok' ? 'Angenommen' : handled[r.name] === 'no' ? 'Abgelehnt' : r.status}</div>
              </div>
              {!handled[r.name] && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="sm" onClick={() => setHandled({ ...handled, [r.name]: 'ok' })}>Annehmen</Button>
                  <IconButton icon="x" label="Ablehnen" size={36} onClick={() => setHandled({ ...handled, [r.name]: 'no' })} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionHead title="Meine Crew" action="Einladen" onAction={() => setInvite(true)} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {window.FRIENDS.map((f) => (
            <FriendRow key={f.name} name={f.name} status={f.status || (f.at ? 'Zuletzt: ' + f.at : 'Nicht am Gelände')} presence={f.presence} action={<IconButton icon="message-circle" label={'Nachricht an ' + f.name} size={36} />} />
          ))}
        </div>
      </div>

      <Card tone="brand" padding={16}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="users" size={19} color="var(--ci-primary)" />
          <div style={{ flex: 1 }}>
            <div style={{ font: 'var(--text-body-strong)' }}>Gemeinsame Festivals</div>
            <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>7 aus deiner Crew sind bei Nova Rise, 4 beim Waldrand.</div>
          </div>
        </div>
      </Card>

      <Button variant="secondary" icon="user-plus" fullWidth onClick={() => setInvite(true)}>Freunde einladen</Button>

      <Sheet open={invite} title="Freunde einladen" onClose={() => setInvite(false)} footer={<Button fullWidth icon="share-2" onClick={() => setInvite(false)}>Link teilen</Button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: 14, borderRadius: 'var(--r-md)', background: 'var(--surface-inset)', font: 'var(--text-mono)', textAlign: 'center' }}>festipal.app/lena-m</div>
          <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>Wer über deinen Link kommt, landet direkt in deiner Crew — Standort teilst du erst danach frei.</p>
        </div>
      </Sheet>
    </div>
  );
}
Object.assign(window, { FriendsScreen });

})();
/* ---- SettingsScreen.jsx ---- */
(function(){
const { ListRow, Switch, Avatar, Badge, Button, Icon, Card } = window.FestipalDesignSystem_ee8ae6;
const { SafeNowCard } = window.FestipalDesignSystem_ee8ae6;

function SettingsScreen({ go }) {
  const { SectionHead } = window;
  const [loc, setLoc] = React.useState(true);
  const [push, setPush] = React.useState(true);
  const [auto, setAuto] = React.useState(false);
  const [artistPush, setArtistPush] = React.useState(true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar name={window.FESTIVAL.me} size={64} presence="online" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: 'var(--text-title-2)' }}>{window.FESTIVAL.me}</div>
          <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>@lenam · seit 2023 dabei</div>
        </div>
        <Button size="sm" variant="quiet">Bearbeiten</Button>
      </div>

      <div>
        <SectionHead title="Konto" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ListRow icon="user-round" label="Profil & Sichtbarkeit" description="Wer dich finden und sehen darf" />
          <ListRow icon="ticket" label="Tickets & Bänder" value="2 aktiv" onClick={() => go('festivals')} />
          <ListRow icon="wallet" label="Cashless & Zahlungen" value="48,50 €" onClick={() => go('wallet')} />
        </div>
      </div>

      <div>
        <SectionHead title="Benachrichtigungen" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ListRow icon="bell" label="Push allgemein" trailing={<Switch checked={push} onChange={setPush} />} />
          <ListRow icon="music-4" label="Neue Artist-Termine" trailing={<Switch checked={artistPush} onChange={setArtistPush} />} />
          <ListRow icon="plus" label="Auto-Aufladung" description="Lädt 25 € nach, wenn unter 10 € fallen" trailing={<Switch checked={auto} onChange={setAuto} />} />
        </div>
      </div>

      <div>
        <SectionHead title="Standort & Sicherheit" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ListRow icon="share-2" label="Standort mit Crew teilen" description="Nur während eines Festivals" trailing={<Switch checked={loc} onChange={setLoc} />} />
          <SafeNowCard status="SafeNow verknüpft · Notfallkontakt gesetzt" />
        </div>
      </div>

      <div>
        <SectionHead title="App" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ListRow icon="globe" label="Sprache" value="Deutsch" />
          <ListRow icon="info" label="Über Festipal" value="1.0.0" />
          <ListRow icon="x" label="Konto löschen" danger />
        </div>
      </div>

      <Button variant="ghost" fullWidth>Abmelden</Button>
    </div>
  );
}
Object.assign(window, { SettingsScreen });

})();
/* ---- DashboardScreen.jsx ---- */
(function(){
const { ActCard, StageStatusCard, NewsCard, SocialRow, FestivalCard } = window.FestipalDesignSystem_ee8ae6;
const { Card, Badge, Button, Icon, Photo, Tag } = window.FestipalDesignSystem_ee8ae6;

function DashboardScreen({ go, acts, onToggleSave }) {
  const { SectionHead, Rail, FriendStack } = window;
  const live = acts.filter((a) => a.live);
  const next = acts.filter((a) => a.day === 'Sa' && !a.live).slice(2, 6);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      <div>
        <SectionHead title="Jetzt live" action="Timetable" onAction={() => go('timetable')} />
        <Rail>
          {live.concat(next.slice(0, 2)).map((a) => (
            <ActCard key={a.artist} {...a} width={252} onToggleSave={() => onToggleSave(a.artist)} onClick={() => go('timetable')} />
          ))}
        </Rail>
      </div>

      <div>
        <SectionHead title="Alle Stages" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {window.STAGES.map((s) => <StageStatusCard key={s.stage} {...s} onClick={() => go('timetable')} />)}
        </div>
      </div>

      <div>
        <SectionHead title="Als Nächstes" action="Alle" onAction={() => go('timetable')} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {next.map((a) => (
            <div key={a.artist} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 'var(--r-md)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
              <Photo name={a.artist} ratio="1 / 1" radius="var(--r-sm)" style={{ width: 48, flex: '0 0 auto' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ font: 'var(--fw-bold) var(--fs-body)/1 var(--font-mono)' }}>{a.time}</span>
                  <span style={{ font: 'var(--text-body-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.artist}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>{a.stage}</span>
                  <FriendStack names={a.friends} />
                </div>
              </div>
              <Icon name="chevron-right" size={17} color="var(--text-muted)" />
            </div>
          ))}
        </div>
      </div>

      <Card interactive padding={16} onClick={() => go('wallet')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'inline-flex', width: 42, height: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center', background: 'var(--fill-brand-quiet)', color: 'var(--ci-primary)' }}><Icon name="wallet" size={20} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: 'var(--text-micro)', letterSpacing: 'var(--ls-caps)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Cashless</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
              <span style={{ font: 'var(--text-title-1)' }}>{window.FESTIVAL.balance}</span>
              <span style={{ font: 'var(--text-title-3)', color: 'var(--text-secondary)' }}>€</span>
            </div>
          </div>
          <Button size="sm" icon="qr-code" onClick={(e) => { e.stopPropagation(); go('wallet'); }}>Bezahlen</Button>
        </div>
      </Card>

      <div>
        <SectionHead title="News" action="Alle" onAction={() => go('news')} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {window.NEWS.slice(0, 2).map((n) => <NewsCard key={n.id} {...n} onClick={() => go('news')} />)}
        </div>
      </div>

      <div>
        <SectionHead title="Featured am Gelände" />
        <Rail>
          {[{ t: 'Silent Disco', s: 'Camp Nord · ab 02:00' }, { t: 'Sunrise Yoga', s: 'Seebühne · So 08:00' }, { t: 'Flohmarkt', s: 'Foodcourt · So 11:00' }].map((e) => (
            <div key={e.t} style={{ width: 190, flex: '0 0 auto' }}>
              <Photo name={e.t} ratio="4 / 3" scrim>
                <div style={{ position: 'absolute', left: 12, right: 12, bottom: 10 }}>
                  <div style={{ font: 'var(--text-title-3)' }}>{e.t}</div>
                  <div style={{ font: 'var(--text-body-sm)', color: 'var(--ink-100)', marginTop: 2 }}>{e.s}</div>
                </div>
              </Photo>
            </div>
          ))}
        </Rail>
      </div>

      <div>
        <SectionHead title="Nova Rise folgen" />
        <SocialRow links={window.FESTIVAL.social} />
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 10 }}>Kurzfristige Änderungen posten wir zuerst hier in der App, dann auf Social.</p>
      </div>
    </div>
  );
}
Object.assign(window, { DashboardScreen });

})();
/* ---- TimetableScreen.jsx ---- */
(function(){
const { SegmentedControl } = window.FestipalDesignSystem_ee8ae6;
const { TimetableSlot, Tag, EmptyState, Button, Icon, Switch } = window.FestipalDesignSystem_ee8ae6;

function TimetableScreen({ acts, onToggleSave }) {
  const { FriendStack } = window;
  const [day, setDay] = React.useState('Sa');
  const [filter, setFilter] = React.useState('Alle');
  const [mode, setMode] = React.useState('alle');
  const stages = ['Alle', 'Mainstage', 'Waldbühne', 'Seezelt'];
  let list = acts.filter((a) => a.day === day && (filter === 'Alle' || a.stage === filter));
  if (mode === 'meine') list = list.filter((a) => a.saved);
  if (mode === 'friends') list = list.filter((a) => a.friends && a.friends.length);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SegmentedControl options={['Fr', 'Sa', 'So']} value={day} onChange={setDay} />
      <SegmentedControl
        options={[{ value: 'alle', label: 'Alle' }, { value: 'meine', label: 'Meine' }, { value: 'friends', label: 'Friends' }]}
        value={mode} onChange={setMode}
      />
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }} className="fp-scroll">
        {stages.map((s) => <Tag key={s} selected={filter === s} onClick={() => setFilter(s)}>{s}</Tag>)}
      </div>
      {mode === 'friends' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--fill-brand-quiet)', border: '1px solid var(--border-brand)', font: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>
          <Icon name="users" size={15} color="var(--ci-primary)" />Acts, die deine Crew gemerkt hat.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((a) => (
          <div key={a.artist}>
            <TimetableSlot {...a} onToggleSave={() => onToggleSave(a.artist)} />
            {a.friends && a.friends.length ? (
              <div style={{ padding: '8px 14px 0 66px' }}><FriendStack names={a.friends} label={a.friends.join(', ') + (a.friends.length > 1 ? ' merken' : ' merkt') + ' sich das'} /></div>
            ) : null}
          </div>
        ))}
      </div>
      {!list.length && <EmptyState icon="calendar-clock" title="Hier ist noch nichts" body={mode === 'meine' ? 'Du hast für diesen Tag noch nichts gemerkt.' : 'Für diesen Tag und diese Bühne haben wir noch keine Slots.'} action={<Button size="sm" variant="quiet" onClick={() => { setFilter('Alle'); setMode('alle'); }}>Filter zurücksetzen</Button>} />}
    </div>
  );
}
Object.assign(window, { TimetableScreen });

})();
/* ---- MapScreen.jsx ---- */
(function(){
const { SafeNowCard, VendorCard } = window.FestipalDesignSystem_ee8ae6;
const { IconButton, Tag, Badge, Icon, Button, Sheet, Rating, SegmentedControl } = window.FestipalDesignSystem_ee8ae6;

/* Schematic plan — the real app renders a vector map tileset. Blocks stand in for it. */
const AREAS = [
  { id: 'main', label: 'Mainstage', x: 8, y: 10, w: 52, h: 24, tone: 'var(--green-800)' },
  { id: 'wald', label: 'Waldbühne', x: 64, y: 8, w: 30, h: 20, tone: 'var(--green-900)' },
  { id: 'see', label: 'Seezelt', x: 66, y: 34, w: 28, h: 16, tone: 'var(--ink-700)' },
  { id: 'food', label: 'Foodcourt', x: 8, y: 40, w: 32, h: 14, tone: 'var(--violet-800)' },
  { id: 'camp-n', label: 'Camp Nord', x: 6, y: 60, w: 42, h: 24, tone: 'var(--ink-700)' },
  { id: 'camp-s', label: 'Camp Süd', x: 52, y: 58, w: 42, h: 26, tone: 'var(--ink-700)' },
];
const PINS = [
  { id: 'me', label: 'Du', x: 46, y: 52, icon: 'user-round', me: true },
  { id: 'f1', label: 'Jonas', x: 30, y: 24, icon: 'user-round' },
  { id: 'f2', label: 'Sara', x: 22, y: 70, icon: 'user-round' },
  { id: 'v1', label: '4,3', x: 20, y: 44, icon: 'utensils', vendor: 0 },
  { id: 'v2', label: '4,7', x: 60, y: 46, icon: 'utensils', vendor: 2 },
  { id: 'help', label: 'Sanitäter', x: 84, y: 56, icon: 'shield-alert', help: true },
];

function MapScreen({ go }) {
  const [layer, setLayer] = React.useState('Freunde');
  const [sel, setSel] = React.useState(null);
  const [sheet, setSheet] = React.useState(null);
  const [rated, setRated] = React.useState({});
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--ink-1000)' }}>
        {AREAS.map((a) => (
          <div key={a.id} onClick={() => setSel(a)} style={{ position: 'absolute', left: a.x + '%', top: a.y + '%', width: a.w + '%', height: a.h + '%', background: a.tone, border: '1px solid ' + (sel && sel.id === a.id ? 'var(--ci-primary)' : 'var(--border-medium)'), borderRadius: 'var(--r-md)', cursor: 'pointer', display: 'flex', alignItems: 'flex-end', padding: 8 }}>
            <span style={{ font: 'var(--text-micro)', letterSpacing: 'var(--ls-caps)', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{a.label}</span>
          </div>
        ))}
        <div style={{ position: 'absolute', left: 0, top: '56%', width: '100%', height: 3, background: 'var(--ink-600)' }} />
        <div style={{ position: 'absolute', left: '49%', top: 0, width: 3, height: '100%', background: 'var(--ink-600)' }} />
        {PINS.map((p) => (
          <button key={p.id} type="button" onClick={() => p.vendor != null ? setSheet(window.VENDORS[p.vendor]) : p.help ? setSheet('help') : null}
            style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', transform: 'translate(-50%,-100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: p.me ? 36 : 30, height: p.me ? 36 : 30, borderRadius: 999, background: p.me ? 'var(--ci-primary)' : p.help ? 'rgba(255,77,94,.9)' : 'var(--surface-1)', color: p.me ? 'var(--ci-on-primary)' : p.help ? 'var(--ink-000)' : 'var(--text-primary)', border: '2px solid ' + (p.me || p.help ? 'transparent' : 'var(--border-strong)'), boxShadow: p.me ? 'var(--glow-primary)' : 'var(--shadow-2)' }}>
              <Icon name={p.icon} size={p.me ? 18 : 15} />
            </span>
            <span style={{ font: 'var(--text-micro)', color: 'var(--text-secondary)', background: 'rgba(7,8,11,.7)', padding: '1px 6px', borderRadius: 999 }}>{p.label}</span>
          </button>
        ))}
      </div>

      <div style={{ position: 'absolute', top: 'var(--topbar-h)', left: 0, right: 0, height: 92, background: 'var(--scrim-top)', pointerEvents: 'none' }} />
      <div className="fp-scroll fp-glass" style={{ position: 'absolute', top: 'calc(var(--topbar-h) + 12px)', left: 'var(--screen-pad)', right: 'var(--screen-pad)', display: 'flex', gap: 8, overflowX: 'auto', padding: 6, borderRadius: 'var(--r-pill)' }}>
        {['Freunde', 'Bühnen', 'Essen & Bars', 'WC', 'Sanitäter', 'Camping'].map((l) => <Tag key={l} selected={layer === l} onClick={() => setLayer(l)}>{l}</Tag>)}
      </div>

      <div style={{ position: 'absolute', right: 'var(--screen-pad)', bottom: 'calc(var(--scroll-bottom-pad) + 108px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <IconButton icon="locate-fixed" variant="glass" label="Auf mich zentrieren" />
        <IconButton icon="share-2" variant="glass" label="Standort teilen" />
        <IconButton icon="star" variant="glass" label="Bewertete Stände" onClick={() => setSheet('vendors')} />
      </div>

      <div style={{ position: 'absolute', left: 'var(--screen-pad)', right: 'var(--screen-pad)', bottom: 'calc(var(--scroll-bottom-pad) - 8px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SafeNowCard status="SafeNow aktiv · Sanitäter 140 m" onAlarm={() => setSheet('help')} onInfo={() => setSheet('help')} compact />
        <div className="fp-glass" style={{ borderRadius: 'var(--r-lg)', padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-flex', width: 38, height: 38, borderRadius: 999, background: 'var(--ci-tint)', color: 'var(--ci-primary)', alignItems: 'center', justifyContent: 'center' }}><Icon name={sel ? 'map-pin' : 'users'} size={18} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: 'var(--text-title-3)' }}>{sel ? sel.label : '4 Freunde am Gelände'}</div>
              <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>{sel ? 'Von dir 3 Min zu Fuß · 240 m' : 'Jonas ist am nächsten — 120 m'}</div>
            </div>
            <Button size="sm" variant="quiet" onClick={() => go('social')}>Crew</Button>
          </div>
        </div>
      </div>

      <Sheet open={sheet === 'vendors'} title="Stände & Bars" onClose={() => setSheet(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }} className="fp-scroll">
          {window.VENDORS.map((v) => (
            <VendorCard key={v.name} {...v} rating={rated[v.name] || v.rating} onRate={(n) => setRated({ ...rated, [v.name]: n })} />
          ))}
          <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>Bewertungen kommen von Gästen am Gelände. Wartezeiten schätzen wir aus den Cashless-Zahlungen der letzten 15 Minuten.</p>
        </div>
      </Sheet>

      <Sheet open={!!sheet && sheet !== 'vendors' && sheet !== 'help'} title={sheet && sheet.name} onClose={() => setSheet(null)} footer={<Button fullWidth icon="map-pin">Hin navigieren</Button>}>
        {sheet && sheet !== 'vendors' && sheet !== 'help' && (
          <VendorCard {...sheet} rating={rated[sheet.name] || sheet.rating} onRate={(n) => setRated({ ...rated, [sheet.name]: n })} />
        )}
      </Sheet>

      <Sheet open={sheet === 'help'} title="SafeNow Notruf" onClose={() => setSheet(null)} footer={<Button fullWidth variant="danger" icon="shield-alert">Hilfe rufen</Button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ font: 'var(--text-body)' }}>Wir schicken deinen Standort an das SafeNow-Team am Gelände. Der nächste Sanitäterpunkt ist 140 m entfernt, beim Foodcourt.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[['Standort', 'Camp Nord, Sektor C4'], ['Nächster Punkt', 'Sanitäter Foodcourt · 140 m'], ['Kontakt', 'Lena Mayr · +43 660 …']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 'var(--r-sm)', background: 'var(--surface-inset)' }}>
                <span style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ font: 'var(--text-body-sm)' }}>{v}</span>
              </div>
            ))}
          </div>
          <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>Design-Platzhalter: die echte SafeNow-Anbindung ist hier nicht implementiert.</p>
        </div>
      </Sheet>
    </div>
  );
}
Object.assign(window, { MapScreen });

})();
/* ---- WalletScreen.jsx ---- */
(function(){
const { BalanceCard } = window.FestipalDesignSystem_ee8ae6;
const { Card, Badge, Button, Sheet, Icon, Checkbox } = window.FestipalDesignSystem_ee8ae6;

function WalletScreen() {
  const [sheet, setSheet] = React.useState(null);
  const [amount, setAmount] = React.useState('25');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      <BalanceCard balance={window.FESTIVAL.balance} festival="Nova Rise" chipId={window.FESTIVAL.chip} onPay={() => setSheet('pay')} onTopUp={() => setSheet('top')} />

      <Card tone="brand" padding={14}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Icon name="sparkles" size={18} color="var(--ci-primary)" />
          <div>
            <div style={{ font: 'var(--text-body-strong)' }}>Auto-Aufladung bei 10 €</div>
            <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)', marginTop: 3 }}>Wir laden 25 € nach, damit du in der Bar-Schlange nicht stehen bleibst.</p>
          </div>
        </div>
      </Card>

      <div>
        <h3 style={{ font: 'var(--text-title-2)', marginBottom: 10 }}>Umsätze</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {window.TX.map((t) => (
            <div key={t.label + t.time} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ display: 'inline-flex', width: 34, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center', background: t.positive ? 'var(--fill-brand-quiet)' : 'var(--fill-quiet)', color: t.positive ? 'var(--ci-primary)' : 'var(--text-muted)' }}>
                <Icon name={t.positive ? 'plus' : 'wallet'} size={16} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: 'var(--text-body-strong)' }}>{t.label}</div>
                <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>{t.detail} · {t.time}</div>
              </div>
              <span style={{ font: 'var(--fw-bold) var(--fs-body)/1 var(--font-mono)', color: t.positive ? 'var(--status-success)' : 'var(--text-primary)' }}>{t.amount} €</span>
            </div>
          ))}
        </div>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 12 }}>Restguthaben zahlen wir bis 14 Tage nach dem Festival automatisch zurück.</p>
      </div>

      <Sheet open={sheet === 'pay'} title="An der Kassa zeigen" onClose={() => setSheet(null)} footer={<Button fullWidth variant="quiet" onClick={() => setSheet(null)}>Fertig</Button>}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 168, height: 168, borderRadius: 'var(--r-lg)', background: 'var(--ink-000)', display: 'grid', gridTemplateColumns: 'repeat(9,1fr)', gap: 3, padding: 14 }}>
            {Array.from({ length: 81 }).map((_, i) => <span key={i} style={{ background: (i * 7 % 5 < 2 || i % 11 === 0) ? 'var(--ink-1000)' : 'transparent', borderRadius: 1 }} />)}
          </div>
          <div style={{ font: 'var(--text-mono)' }}>{window.FESTIVAL.chip}</div>
          <Badge tone="brand" icon="check">Guthaben {window.FESTIVAL.balance} €</Badge>
        </div>
      </Sheet>

      <Sheet open={sheet === 'top'} title="Guthaben aufladen" onClose={() => setSheet(null)} footer={<Button fullWidth onClick={() => setSheet(null)}>{amount},00 € aufladen</Button>}>
        <div style={{ display: 'flex', gap: 10 }}>
          {['15', '25', '50'].map((a) => (
            <button key={a} type="button" onClick={() => setAmount(a)} style={{ flex: 1, height: 62, borderRadius: 'var(--r-md)', cursor: 'pointer', background: amount === a ? 'var(--fill-brand-quiet)' : 'var(--surface-inset)', border: '1.5px solid ' + (amount === a ? 'var(--border-brand)' : 'var(--border-subtle)'), color: amount === a ? 'var(--ci-primary)' : 'var(--text-primary)', font: 'var(--text-title-2)' }}>{a} €</button>
          ))}
        </div>
        <div style={{ marginTop: 14 }}><Checkbox round label="Apple Pay · Standard" checked onChange={() => {}} /><Checkbox round label="Karte · **** 4417" checked={false} onChange={() => {}} /></div>
      </Sheet>
    </div>
  );
}
Object.assign(window, { WalletScreen });

})();
/* ---- SwapScreen.jsx ---- */
(function(){
const { SwapListingCard } = window.FestipalDesignSystem_ee8ae6;
const { SegmentedControl, Input } = window.FestipalDesignSystem_ee8ae6;
const { Tag, Button, Sheet, EmptyState, Card, Icon } = window.FestipalDesignSystem_ee8ae6;

function SwapScreen() {
  const [mode, setMode] = React.useState('alle');
  const [kind, setKind] = React.useState('Alle');
  const [sheet, setSheet] = React.useState(false);
  const list = window.LISTINGS.filter((l) => kind === 'Alle' || (kind === 'Tausch' && l.kind === 'tausch') || (kind === 'Suche' && l.kind === 'suche') || (kind === 'Verschenkt' && l.kind === 'verschenkt'));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input icon="search" placeholder="Zelt, Ticket, Shuttle …" />
      <SegmentedControl options={[{ value: 'alle', label: 'Alle Angebote' }, { value: 'nah', label: 'In der Nähe' }]} value={mode} onChange={setMode} />
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }} className="fp-scroll">
        {['Alle', 'Tausch', 'Suche', 'Verschenkt'].map((k) => <Tag key={k} selected={kind === k} onClick={() => setKind(k)}>{k}</Tag>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((l) => <SwapListingCard key={l.id} {...l} onClick={() => setSheet(l)} />)}
      </div>
      {!list.length && <EmptyState icon="repeat-2" title="Noch keine Tauschangebote" body="Sei die Erste, die hier etwas anbietet." action={<Button size="sm" icon="plus" onClick={() => setSheet('new')}>Angebot erstellen</Button>} />}
      <Button variant="secondary" icon="plus" fullWidth onClick={() => setSheet('new')}>Eigenes Angebot</Button>

      <Sheet open={!!sheet && sheet !== 'new'} title={sheet && sheet.title} onClose={() => setSheet(false)} footer={<Button fullWidth icon="repeat-2">Tausch anfragen</Button>}>
        {sheet && sheet !== 'new' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card tone="inset" padding={14}>
              <div style={{ font: 'var(--text-micro)', letterSpacing: 'var(--ls-caps)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Biete</div>
              <div style={{ font: 'var(--text-body)', marginTop: 4 }}>{sheet.offers}</div>
              <div style={{ font: 'var(--text-micro)', letterSpacing: 'var(--ls-caps)', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 12 }}>Suche</div>
              <div style={{ font: 'var(--text-body)', marginTop: 4 }}>{sheet.wants}</div>
            </Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}><Icon name="tent" size={14} />{sheet.area} · {sheet.distance} zu Fuß</div>
            <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>Wir schicken {sheet.owner} deine Anfrage. Erst wenn beide zustimmen, tauschen wir die Plätze im System.</p>
          </div>
        )}
      </Sheet>

      <Sheet open={sheet === 'new'} title="Angebot erstellen" onClose={() => setSheet(false)} footer={<Button fullWidth onClick={() => setSheet(false)}>Veröffentlichen</Button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Titel" placeholder="z. B. Zeltplatz-Nachbarschaft" />
          <Input label="Was biete ich?" placeholder="2 Plätze Camp Süd" />
          <Input label="Was suche ich?" placeholder="2 Plätze Camp Nord" hint="Leer lassen, wenn du es verschenkst." />
        </div>
      </Sheet>
    </div>
  );
}
Object.assign(window, { SwapScreen });

})();
/* ---- CrewScreen.jsx ---- */
(function(){
const { ActivityCard, FriendRow } = window.FestipalDesignSystem_ee8ae6;
const { SegmentedControl } = window.FestipalDesignSystem_ee8ae6;
const { Button, IconButton, Card, Icon, EmptyState, Sheet, Input } = window.FestipalDesignSystem_ee8ae6;

function CrewScreen() {
  const [tab, setTab] = React.useState('aktivitaeten');
  const [joined, setJoined] = React.useState({});
  const [sheet, setSheet] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SegmentedControl options={[{ value: 'aktivitaeten', label: 'Aktivitäten' }, { value: 'crew', label: 'Freunde' }]} value={tab} onChange={setTab} />
      {tab === 'aktivitaeten' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {window.ACTIVITIES.map((a) => (
            <ActivityCard key={a.id} {...a} joined={!!joined[a.id]} onJoin={() => setJoined({ ...joined, [a.id]: !joined[a.id] })} />
          ))}
          <Button variant="secondary" icon="plus" fullWidth onClick={() => setSheet(true)}>Aktivität starten</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Card tone="brand" padding={14}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="share-2" size={18} color="var(--ci-primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ font: 'var(--text-body-strong)' }}>Standort geteilt bis 03:00</div>
                <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>Nur für 5 Personen aus deiner Crew.</div>
              </div>
            </div>
          </Card>
          {window.FRIENDS.map((f) => (
            <FriendRow key={f.name} {...f} action={<IconButton icon="message-circle" label={'Nachricht an ' + f.name} size={36} />} />
          ))}
          <Button variant="quiet" icon="user-plus" fullWidth>Freunde einladen</Button>
        </div>
      )}
      <Sheet open={sheet} title="Aktivität starten" onClose={() => setSheet(false)} footer={<Button fullWidth variant="secondary" onClick={() => setSheet(false)}>Los, fragen</Button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Was machen wir?" placeholder="Sonnenuntergang am Hügel" />
          <Input label="Wann?" placeholder="Heute 20:40" />
          <Input label="Wo treffen wir uns?" placeholder="Hügel hinter Camp Nord" />
        </div>
      </Sheet>
    </div>
  );
}
Object.assign(window, { CrewScreen });

})();
/* ---- NewsScreen.jsx ---- */
(function(){
const { NewsCard, SocialRow } = window.FestipalDesignSystem_ee8ae6;
const { Tag } = window.FestipalDesignSystem_ee8ae6;

function NewsScreen() {
  const [kind, setKind] = React.useState('Alle');
  const map = { Wichtig: 'warning', Lineup: 'lineup', Info: 'info' };
  const all = window.NEWS.concat(window.GLOBAL_NEWS);
  const list = all.filter((n) => kind === 'Alle' || n.kind === map[kind]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }} className="fp-scroll">
        {['Alle', 'Wichtig', 'Lineup', 'Info'].map((k) => <Tag key={k} selected={kind === k} onClick={() => setKind(k)}>{k}</Tag>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((n) => <NewsCard key={n.id} {...n} />)}
      </div>
      <SocialRow label="Auch auf Social" links={['instagram', 'tiktok', 'youtube']} size={38} />
    </div>
  );
}
Object.assign(window, { NewsScreen });

})();
/* ---- ProfileScreen.jsx ---- */
(function(){
const { Switch } = window.FestipalDesignSystem_ee8ae6;
const { Avatar, Card, Badge, Button, StatTile, Icon } = window.FestipalDesignSystem_ee8ae6;

function ProfileScreen() {
  const [share, setShare] = React.useState(true);
  const [push, setPush] = React.useState(true);
  const [auto, setAuto] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar name={window.FESTIVAL.me} size={72} presence="online" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: 'var(--text-title-1)' }}>{window.FESTIVAL.me}</div>
          <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>@lenam · seit 2023 dabei</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}><Badge tone="brand" icon="check">Ticket aktiv</Badge><Badge>Camp Nord · C4</Badge></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <StatTile icon="music-4" label="Acts gemerkt" value={12} tone="brand" />
        <StatTile icon="tent" label="Festivals" value={7} />
        <StatTile icon="repeat-2" label="Tausche" value={4} tone="secondary" />
      </div>

      <div>
        <h3 style={{ font: 'var(--text-title-2)', marginBottom: 10 }}>Ticket & Band</h3>
        <Card padding={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'inline-flex', width: 40, height: 40, borderRadius: 999, background: 'var(--fill-quiet)', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}><Icon name="qr-code" size={19} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ font: 'var(--text-body-strong)' }}>Nova Rise · Weekend + Camping</div>
              <div style={{ font: 'var(--text-mono)', color: 'var(--text-muted)', marginTop: 2 }}>{window.FESTIVAL.chip}</div>
            </div>
            <Button size="sm" variant="quiet">Zeigen</Button>
          </div>
        </Card>
      </div>

      <div>
        <h3 style={{ font: 'var(--text-title-2)', marginBottom: 10 }}>Einstellungen</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[['Standort mit Freunden teilen', 'Nur während des Festivals', share, setShare],
            ['Push für Lineup-Änderungen', 'Auch wenn du offline warst', push, setPush],
            ['Auto-Aufladung', 'Lädt 25 € nach, wenn unter 10 € fallen', auto, setAuto]].map(([l, d, v, set]) => (
            <div key={l} style={{ padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <Switch label={l} description={d} checked={v} onChange={set} />
            </div>
          ))}
        </div>
      </div>

      <Button variant="ghost" fullWidth>Abmelden</Button>
    </div>
  );
}
Object.assign(window, { ProfileScreen });

})();
/* ---- App.jsx ---- */
(function(){
/* Two navigation contexts: the global Festipal shell and a single festival. */
const GLOBAL_NAV = [
  { value: 'overview', icon: 'home', label: 'Home' },
  { value: 'festivals', icon: 'tent', label: 'Festivals' },
  { value: 'artists', icon: 'music-4', label: 'Artists' },
  { value: 'friends', icon: 'users', label: 'Friends' },
  { value: 'settings', icon: 'settings', label: 'Mehr' },
];
const FESTIVAL_NAV = [
  { value: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
  { value: 'swap', icon: 'repeat-2', label: 'Tausch' },
  { value: 'social', icon: 'users', label: 'Crew' },
  { value: 'timetable', icon: 'calendar-clock', label: 'Timetable' },
  { value: 'map', icon: 'map-pin', label: 'Lageplan' },
];

function App({ initialTab = 'overview', initialFestival = null }) {
  /* Resolved at render time: in a bundled/offline build the design-system bundle
     may finish loading after this file is evaluated. */
  const { TopBar, FloatingNav, IconButton } = window.FestipalDesignSystem_ee8ae6 || {};
  const [festival, setFestival] = React.useState(initialFestival);
  const [tab, setTab] = React.useState(initialTab);
  const [acts, setActs] = React.useState(window.ACTS);
  const toggleSave = (artist) => setActs((prev) => prev.map((a) => (a.artist === artist ? { ...a, saved: !a.saved } : a)));

  const openFestival = (fest) => { setFestival(fest); setTab('dashboard'); };
  const goHome = () => { setFestival(null); setTab('overview'); };

  const inFestival = !!festival;
  const nav = inFestival ? FESTIVAL_NAV : GLOBAL_NAV;
  const navValue = nav.some((n) => n.value === tab) ? tab : null;

  const TITLES = {
    overview: ['Festipal', 'Deine Festival Buddy App'],
    festivals: ['Meine Festivals', null],
    artists: ['Meine Artists', null],
    friends: ['Friends', '5 in deiner Crew'],
    settings: ['Einstellungen', null],
    dashboard: [festival ? festival.name : '', window.FESTIVAL.day],
    map: ['Lageplan', 'SafeNow aktiv'],
    timetable: ['Timetable', festival ? festival.name : ''],
    wallet: ['Cashless', window.FESTIVAL.chip],
    social: ['Aktivitäten & Friends', null],
    swap: ['Tauschbörse', 'Camping & Tickets'],
    news: ['News', festival ? festival.name : 'Festipal'],
    profile: ['Profil', null],
  };
  const [title, subtitle] = TITLES[tab] || TITLES.overview;
  const pushed = ['news', 'profile', 'wallet'].includes(tab);
  const fullBleed = tab === 'map';

  /* Lazy: only the visible screen is instantiated, so a screen file that has not
     finished loading yet can never break the shell. */
  const SCREENS = {
    overview: () => <window.OverviewScreen go={setTab} openFestival={openFestival} />,
    festivals: () => <window.MyFestivalsScreen openFestival={openFestival} />,
    artists: () => <window.MyArtistsScreen />,
    friends: () => <window.FriendsScreen />,
    settings: () => <window.SettingsScreen go={setTab} />,
    dashboard: () => <window.DashboardScreen go={setTab} acts={acts} onToggleSave={toggleSave} />,
    timetable: () => <window.TimetableScreen acts={acts} onToggleSave={toggleSave} />,
    map: () => <window.MapScreen go={setTab} />,
    wallet: () => <window.WalletScreen />,
    swap: () => <window.SwapScreen />,
    social: () => <window.CrewScreen />,
    news: () => <window.NewsScreen />,
    profile: () => <window.ProfileScreen />,
  };
  const render = SCREENS[tab];
  const screen = render ? render() : null;
  if (!TopBar || !FloatingNav) return null;

  return (
    <div style={{ position: 'relative', width: 'var(--content-max)', height: 900, margin: '0 auto', overflow: 'hidden', background: 'var(--bg-app)', borderRadius: 42, border: '1px solid var(--border-medium)', boxShadow: 'var(--shadow-3)' }}>
      <TopBar
        title={title} subtitle={subtitle} profileName={window.FESTIVAL.me}
        backIcon={pushed ? 'arrow-left' : undefined}
        onHome={pushed ? () => setTab(inFestival ? 'dashboard' : 'overview') : goHome}
        onProfile={() => setTab('profile')}
      />
      {fullBleed ? screen : (
        <div className="fp-scroll" style={{ position: 'absolute', top: 'var(--topbar-h)', left: 0, right: 0, bottom: 0, padding: '18px var(--screen-pad) var(--scroll-bottom-pad)' }}>
          {screen}
        </div>
      )}
      {(tab === 'dashboard' || tab === 'overview') && (
        <div style={{ position: 'absolute', top: 10, right: 60, zIndex: 45 }}>
          <IconButton icon="bell" label="News" size={36} variant="bare" onClick={() => setTab('news')} />
        </div>
      )}
      <FloatingNav items={nav} value={navValue} onChange={setTab} />
    </div>
  );
}

Object.assign(window, { FestipalApp: App });

})();
