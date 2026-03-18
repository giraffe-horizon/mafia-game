# [1.5.0](https://github.com/giraffe-horizon/mafia-game/compare/v1.4.0...v1.5.0) (2026-03-18)


### Bug Fixes

* complete remaining audit fixes ([1064b47](https://github.com/giraffe-horizon/mafia-game/commit/1064b47d1485e9b17c0b3c19daa435ac8ac51cdc))
* critical - rematch tokens, transfer GM session, action race condition, dead mafia actions ([1f44900](https://github.com/giraffe-horizon/mafia-game/commit/1f449001bc45bac2d27a4788375caf1f4572c087))
* critical logic bugs - role visibility, vote phase filter, dead target check ([5982376](https://github.com/giraffe-horizon/mafia-game/commit/59823760b44ed5c8dae4bc6f3c7db265530228bd))
* hide detective result completely when role hidden (no hint leak) ([420da12](https://github.com/giraffe-horizon/mafia-game/commit/420da124531cd57e310e3811f461df2317ab3621))
* partial audit fixes - types, error handling, ranking query layer ([d91a50e](https://github.com/giraffe-horizon/mafia-game/commit/d91a50e789c6f629f57c346639db96fe5f75b001))
* rematch clears old game data (actions, messages, missions) ([ff35979](https://github.com/giraffe-horizon/mafia-game/commit/ff35979e76454a7e50a25424b648d6163f9881b9))
* replace emoji dots with check/close icons on right side of player row ([801c7bc](https://github.com/giraffe-horizon/mafia-game/commit/801c7bc3c85e9e535fba68d14f509a0d8c2ffbcf))
* resolve all critical and high issues from final audit v2 ([b25bcd7](https://github.com/giraffe-horizon/mafia-game/commit/b25bcd7fd23f09169eab048140e60946e4b991be))
* resolve test failures from db modularization ([6792647](https://github.com/giraffe-horizon/mafia-game/commit/6792647861ddff5cec19882b30d1799587684273))
* restore corrupted handler.ts (broken by code scanning auto-fix) ([328111c](https://github.com/giraffe-horizon/mafia-game/commit/328111cc2a55904a48327a906fbabed18a10f247))
* show dead spectator view in all game phases ([6385f0f](https://github.com/giraffe-horizon/mafia-game/commit/6385f0f2311edb2cb05aa92bfc400d3cbcd281c1))
* show detective investigation result in DayView ([944b020](https://github.com/giraffe-horizon/mafia-game/commit/944b020299808b893324ed0f22657bdc9c492516))
* stop polling loop when tab hidden, instant refresh on return ([3c80155](https://github.com/giraffe-horizon/mafia-game/commit/3c801559b29d2887f3f43f3c9aea4827c9556805))
* unify loading spinner with design system (primary red, typewriter font) ([67c27ff](https://github.com/giraffe-horizon/mafia-game/commit/67c27ffed8aa63d5de0847fa686b5bf4c991f6ad))
* update coverage config for db/ module structure ([ca2af5c](https://github.com/giraffe-horizon/mafia-game/commit/ca2af5c3b94e127f0b0ce3ee218c445ad496f9b1))


### Features

* add error.tsx and loading.tsx for error boundaries ([ee4d22f](https://github.com/giraffe-horizon/mafia-game/commit/ee4d22f3cc3f2e377b4c6550698727561887acc2))
* add GameService abstraction layer for transport independence ([4892b33](https://github.com/giraffe-horizon/mafia-game/commit/4892b33b7128deffb3cf58f711b1bcdb734bb1b5))
* add RoleHidden wrapper, hide detective result when role not revealed ([b8220e1](https://github.com/giraffe-horizon/mafia-game/commit/b8220e13cdc7bafc4dbc9854536c4d464b956213))
* add Zod validation to all API routes ([6c004e7](https://github.com/giraffe-horizon/mafia-game/commit/6c004e749b51b3c080d3ece8f8e329eb02f6fbde))
* add Zustand game store with polling and actions ([5e64e10](https://github.com/giraffe-horizon/mafia-game/commit/5e64e102fad1f15da31d77477397cb08e782b875))
* cumulative scoring across rounds with player_round_scores ([133cbcd](https://github.com/giraffe-horizon/mafia-game/commit/133cbcd72a04b231b642b2e884276c4ed0a381eb))
* detective sees investigated players marked on player list ([877d0f1](https://github.com/giraffe-horizon/mafia-game/commit/877d0f1ddca72a8b1b08d550b248189df91413a5))
* doctor cannot protect same player two rounds in a row ([ca434de](https://github.com/giraffe-horizon/mafia-game/commit/ca434ded1b975c59aa7d83528f46c561b2b01009))
* expand UI component library (PageLayout, SectionHeader, StatusItem, ActionBar, InfoCard, TabBar, FormField) ([1b493ad](https://github.com/giraffe-horizon/mafia-game/commit/1b493addff285a127957c392fb8a4d2b9abd486e))
* extract reusable UI components (Button, Card, Badge, Select, Input, ProgressBar, Modal, GameLayout) ([c0930d7](https://github.com/giraffe-horizon/mafia-game/commit/c0930d7a1a8b9583df0dc7ff5912a0bccf1ba6e7))
* ranking as modal instead of separate page ([5cb5da0](https://github.com/giraffe-horizon/mafia-game/commit/5cb5da064379036d52ef3f0961573eb5be9f9630))
* rematch resets game in-place, preserves tokens and lobby ([c743f02](https://github.com/giraffe-horizon/mafia-game/commit/c743f028fce5c42356a9aaa9396b5e0b01ea6c00))


### Performance Improvements

* add lazy loading to all images ([4708585](https://github.com/giraffe-horizon/mafia-game/commit/4708585f4d7fc02e6c874c65952c4ba3fb542163))
* home page Server Component shell with Client island ([0756218](https://github.com/giraffe-horizon/mafia-game/commit/07562181eaec133b1cd37fb5ca70cf4badb379b4))
* migrate fonts to next/font/google ([9846220](https://github.com/giraffe-horizon/mafia-game/commit/9846220e0323ad2a9bf98c637863402c2d02a9ea))
* polling optimization with visibility API and error backoff ([0731eee](https://github.com/giraffe-horizon/mafia-game/commit/0731eee89b3d5ce54b6ea725118287b3fb96dab1))
* replace router.push with next/link for navigation ([7f1706b](https://github.com/giraffe-horizon/mafia-game/commit/7f1706b474d8984d0bb68419f88db7719d4c9c0e))

# [1.4.0](https://github.com/giraffe-horizon/mafia-game/compare/v1.3.1...v1.4.0) (2026-03-18)


### Bug Fixes

* address code review — atomicity, refactor, test coverage ([20be270](https://github.com/giraffe-horizon/mafia-game/commit/20be2704a348df85703d240f8c5690e029f87c4d))
* expose error details in phase endpoint for debugging ([fb0c24c](https://github.com/giraffe-horizon/mafia-game/commit/fb0c24c9683f49ff1437271a11a4b6de3a0ce0d2))
* hide mafia members from mafia kill targets ([77c77c5](https://github.com/giraffe-horizon/mafia-game/commit/77c77c5e9c68e21946bc927bb2bd3ee2a58a4c3f))
* include self in mafia team actions for correct consensus ([f970df5](https://github.com/giraffe-horizon/mafia-game/commit/f970df53d9a8876c58cd93896b87153d55068b43))
* mafia voting - show all members, remove duplicates, GM vote visibility ([68dee81](https://github.com/giraffe-horizon/mafia-game/commit/68dee8195cc84a3c49f073155d5e78167dd04cb5))
* mafia voting consensus + remove duplicate emoji from buttons ([f335f35](https://github.com/giraffe-horizon/mafia-game/commit/f335f3571f5a7d6783eaa9e02d0682559fbc5212))
* remove duplicate mafia votes section from GM panel ([f542234](https://github.com/giraffe-horizon/mafia-game/commit/f54223456d8d385ed97af8a47d395e6b37466e92))
* use host player_id for system messages (NOT NULL constraint) ([24912db](https://github.com/giraffe-horizon/mafia-game/commit/24912dbfb40e76c53c60aa5e6a878f9adf253023))


### Features

* add placeholder for players choosing character ([c3c7f03](https://github.com/giraffe-horizon/mafia-game/commit/c3c7f03699122e43ad62a2d502f77d03bbba7db4))
* GM progress dashboard with phase blocking (closes [#5](https://github.com/giraffe-horizon/mafia-game/issues/5)) ([ac5c984](https://github.com/giraffe-horizon/mafia-game/commit/ac5c98495ad3b96213209e9bf1f279778ad8e549))
* merge phase/actions tabs, mafia unanimous vote, transfer GM in settings (closes [#5](https://github.com/giraffe-horizon/mafia-game/issues/5)) ([e1f2403](https://github.com/giraffe-horizon/mafia-game/commit/e1f2403c9826a6d4b4741a8775145dc5d924eb95))

## [1.3.1](https://github.com/giraffe-horizon/mafia-game/compare/v1.3.0...v1.3.1) (2026-03-17)


### Bug Fixes

* restore ranking button in game header ([bd7f830](https://github.com/giraffe-horizon/mafia-game/commit/bd7f83031c35118232bd2dcc2f2ae7159f3cccdb))

# [1.3.0](https://github.com/giraffe-horizon/mafia-game/compare/v1.2.0...v1.3.0) (2026-03-17)


### Bug Fixes

* UI polish — scroll lock, avatar placeholders, header redesign, auto-join ([bec1f39](https://github.com/giraffe-horizon/mafia-game/commit/bec1f391cce0bab142c066ffd97ea3460041d08c))
* update test to expect empty string instead of null for nickname ([d5c3055](https://github.com/giraffe-horizon/mafia-game/commit/d5c3055df2ecfa9d8bcc872aa4e3227bf4883089))
* use empty string instead of null for nickname (D1 NOT NULL constraint) ([5b696db](https://github.com/giraffe-horizon/mafia-game/commit/5b696dbba81707e4dcaf65e3b3274b0679ff03f7))


### Features

* character selection system with R2 avatars (closes [#3](https://github.com/giraffe-horizon/mafia-game/issues/3)) ([9ad244c](https://github.com/giraffe-horizon/mafia-game/commit/9ad244c833f580863811bbb3b3105673788ff1da))
* onboarding refactor + UI fixes ([7849977](https://github.com/giraffe-horizon/mafia-game/commit/7849977f666601eb1d1304d64713c2f17a2547ef))

# [1.2.0](https://github.com/giraffe-horizon/mafia-game/compare/v1.1.2...v1.2.0) (2026-03-17)


### Features

* handle players leaving game mid-session (closes [#2](https://github.com/giraffe-horizon/mafia-game/issues/2)) ([#8](https://github.com/giraffe-horizon/mafia-game/issues/8)) ([ed4273d](https://github.com/giraffe-horizon/mafia-game/commit/ed4273dd9e1aa68b6072cbbf2c38d2ecf7bacfa1))

## [1.1.2](https://github.com/giraffe-horizon/mafia-game/compare/v1.1.1...v1.1.2) (2026-03-17)


### Bug Fixes

* resolve all 20 lint warnings ([db0cc1c](https://github.com/giraffe-horizon/mafia-game/commit/db0cc1cde2cde518533b26ba1239427ed4f52a50))

## [1.1.1](https://github.com/giraffe-horizon/mafia-game/compare/v1.1.0...v1.1.1) (2026-03-17)


### Bug Fixes

* auto-deploy production on new release + explicit env flags ([03e609c](https://github.com/giraffe-horizon/mafia-game/commit/03e609c57ab634727c74f29ff95b319f4ae4cf73))

# [1.1.0](https://github.com/giraffe-horizon/mafia-game/compare/v1.0.0...v1.1.0) (2026-03-17)


### Bug Fixes

* add version to page title and meta tags ([49d981c](https://github.com/giraffe-horizon/mafia-game/commit/49d981cad58a61753251933be49577e6d325ace5))


### Features

* handle players leaving game mid-session (closes [#2](https://github.com/giraffe-horizon/mafia-game/issues/2)) ([a0ed0c4](https://github.com/giraffe-horizon/mafia-game/commit/a0ed0c4d66f57b505caa4b4e8b269b464308cef8))

# 1.0.0 (2026-03-17)


### Bug Fixes

* add account_id to wrangler.jsonc for Workers deploy ([4a71727](https://github.com/giraffe-horizon/mafia-game/commit/4a71727eb33ba5f54e834c807f89e12925c47b7e))
* add force-dynamic to game/ranking pages + reset next.config ([929ec18](https://github.com/giraffe-horizon/mafia-game/commit/929ec182607fdef213635291d3701743118c5562))
* block phase change until all votes are in ([8a1bfc2](https://github.com/giraffe-horizon/mafia-game/commit/8a1bfc2754f5f805f9a24ba4e66d25768a079fed))
* clarify round increment logic (voting→night = new round) ([f68cb89](https://github.com/giraffe-horizon/mafia-game/commit/f68cb897f27f244eb4d7a91a7ab0b1913131a1ed))
* code paste works via onChange fallback (multi-char detection) ([de53a84](https://github.com/giraffe-horizon/mafia-game/commit/de53a846e0f415686fb6f8f60f1b4d6793bd528d))
* copy assets/* to .open-next root for CF Pages static serving ([6811d04](https://github.com/giraffe-horizon/mafia-game/commit/6811d048e9b24ae9d089c40d7dae760ff8c711e3))
* disable start when not enough players, hide doctor/cop text in simple mode ([48f28fd](https://github.com/giraffe-horizon/mafia-game/commit/48f28fd77e380ebb165b2e6e1a520c84f391b8cf))
* exclude GM from voting targets ([6ea0a38](https://github.com/giraffe-horizon/mafia-game/commit/6ea0a382c2363a0e423e84c6d261c2cb25ffa1fb))
* GM can change target for any player (not just pending) ([f0481a3](https://github.com/giraffe-horizon/mafia-game/commit/f0481a3beec4931f827280853c88d1fff398eee8))
* GM excluded from role assignment, shown as 'Mistrz Gry' not player ([30790ce](https://github.com/giraffe-horizon/mafia-game/commit/30790ce874c1f2ad7af579bcdbb05d6f089f204f))
* hide action type details when role is hidden (no role leak) ([08d131e](https://github.com/giraffe-horizon/mafia-game/commit/08d131eab1f3b2b282b999f895d9abbcef14e489))
* identical night UI for all roles — civilians pick target like everyone else ([6bd939c](https://github.com/giraffe-horizon/mafia-game/commit/6bd939c113f49d8b4666ede1247ac451206f460e))
* mafia count selector uses nonHostPlayers instead of players ([53774ac](https://github.com/giraffe-horizon/mafia-game/commit/53774ac1d3fb716f4e787a14e915104ecd39b9a9))
* make pre-commit hook executable ([6a4467d](https://github.com/giraffe-horizon/mafia-game/commit/6a4467d272bc3b9c156a2f9f2948d5eda2809e4f))
* min 3 players simple, min 5 players full ([186871d](https://github.com/giraffe-horizon/mafia-game/commit/186871d67c4c1f5b328aa2935bf52936cc7b4341))
* pin wrangler v4 in CI deploy actions ([e21c89c](https://github.com/giraffe-horizon/mafia-game/commit/e21c89c5474f0a8886e17c46fa4e255127980735))
* React hooks order — useEffect before conditional returns (error [#310](https://github.com/giraffe-horizon/mafia-game/issues/310) again) ([2c11ca2](https://github.com/giraffe-horizon/mafia-game/commit/2c11ca211d1b8e57b4ad2a3478b480ecdf42f176))
* React hooks order — useState before conditional returns (error [#310](https://github.com/giraffe-horizon/mafia-game/issues/310)) ([f4f125d](https://github.com/giraffe-horizon/mafia-game/commit/f4f125de2ab81dd30321e2286dce9da17b0257b2))
* regenerate lockfile + format all files for CI ([d778561](https://github.com/giraffe-horizon/mafia-game/commit/d77856145509bde331e307f43fa27bd9d27fd357))
* rematch clears old actions + messages (prevents stale selections) ([56b7711](https://github.com/giraffe-horizon/mafia-game/commit/56b7711c6514966a75872955e06d4119a2d33e25))
* remove player self-highlighting (no (ty) label, same border for all) ([7086724](https://github.com/giraffe-horizon/mafia-game/commit/70867247b4ac583c45933a583600ed0c52b979a7))
* remove roles from ranking view ([38f0029](https://github.com/giraffe-horizon/mafia-game/commit/38f00299d23a233ce7610adc4ae61a76e684c40e))
* remove secret/public mission distinction — all missions are private ([5b7a9a5](https://github.com/giraffe-horizon/mafia-game/commit/5b7a9a5a2733d85229b97eccb2fb915ff328898c))
* resolve ESLint error and remove unused imports/props in GameClient ([85b128c](https://github.com/giraffe-horizon/mafia-game/commit/85b128cd10fad7bc39de17dacb4c5f6d1e51c93a))
* responsive full-width mobile, max-w-lg centered on desktop ([78ec0dd](https://github.com/giraffe-horizon/mafia-game/commit/78ec0dddd7d156a917d429306a2f87f873145836))
* restore emerald border + (Ty) badge for current player in list ([79130da](https://github.com/giraffe-horizon/mafia-game/commit/79130da0415e8e91b4d58402a57f7b909d60c594))
* set pages_build_output_dir to .open-next root ([9dff74d](https://github.com/giraffe-horizon/mafia-game/commit/9dff74d01a387c4c574776d157da40c1cc06661c))
* simpler 6-char session code, no confusing chars (0/O/1/I/L/5/S/8/B) ([1d87274](https://github.com/giraffe-horizon/mafia-game/commit/1d872744c320c7da88672e84992a3a6a5227b6c7))
* switch deploy from CF Pages to Workers via wrangler ([52bba21](https://github.com/giraffe-horizon/mafia-game/commit/52bba2124402e4e3300810fd698e9e0215993da2))
* switch to @cloudflare/next-on-pages, edge runtime, working CF deploy ([55e8a18](https://github.com/giraffe-horizon/mafia-game/commit/55e8a18749f314f7cd564ec75e7f48a299c344bf))
* switch to wrangler deploy (Workers) — CF Pages can't serve OpenNext ([2d0d0bc](https://github.com/giraffe-horizon/mafia-game/commit/2d0d0bcb7a43a6635c25032c89940fca2818d221))
* use CF Pages auto-deploy with OpenNext _worker.js convention ([d84ee25](https://github.com/giraffe-horizon/mafia-game/commit/d84ee2568b26a7d5bb63fb515febe879cd66df5c))
* use defineCloudflareConfig + strip DO exports from worker ([2294304](https://github.com/giraffe-horizon/mafia-game/commit/2294304bb91b4b37199e0ee68a8d38d4597973e8))
* use dynamic origin for join URL + add preview deploys on PRs ([d2f85b2](https://github.com/giraffe-horizon/mafia-game/commit/d2f85b2195ea5f229c90c61ce35880bb662149bd))
* use Node 22 in CI (matches lockfileVersion 3 from npm 11) ([3869b34](https://github.com/giraffe-horizon/mafia-game/commit/3869b340627cef091bfa0956b74ec751e808368e))
* use npm ci --force to handle cross-platform optional deps ([ae29d57](https://github.com/giraffe-horizon/mafia-game/commit/ae29d5782fae2c18a762639947d90a54ce7a3717))


### Features

* add semantic-release + version display on landing page ([0534550](https://github.com/giraffe-horizon/mafia-game/commit/0534550d9d75bfab198ce533b6f8a7e8d5d5ed5e))
* add unit tests (108, 73% coverage), docs, update CI ([8b13592](https://github.com/giraffe-horizon/mafia-game/commit/8b1359248d9c612071381992edc8ec3369b2667e))
* allow changing night action & vote before phase ends ([7f957b2](https://github.com/giraffe-horizon/mafia-game/commit/7f957b2b0cb7eca7b21109baf3764d8a6650a8ce))
* balanced mafia proportions + GM mafia count selector ([1a32303](https://github.com/giraffe-horizon/mafia-game/commit/1a32303e6d8edbe5de418645c58b7a05297e0866))
* D1 database + etap 2 gameplay (fazy, akcje nocne, głosowanie, wiadomości, misje) ([37e52dd](https://github.com/giraffe-horizon/mafia-game/commit/37e52dd0d8d501ab6e12e99893ce6c1f77960f9e))
* D1 database + Etap 2 gameplay (fazy, akcje, wiadomości, misje) ([88abba9](https://github.com/giraffe-horizon/mafia-game/commit/88abba9d1e8549832d6240cbe9f80d08f5ac121b))
* dead players see spectator view with all roles revealed ([1dae106](https://github.com/giraffe-horizon/mafia-game/commit/1dae1066cf30a664c839c8b677f4f6f6c3d0c6cd))
* enterprise deploy pipeline — staging + production + migrations ([835383e](https://github.com/giraffe-horizon/mafia-game/commit/835383e2dfdbb61141dbc2dd9a1b182a3a5597c9))
* feedback round — QR, ranking, rematch, transfer GM, predef missions, UI fixes, civilian decoy ([20af250](https://github.com/giraffe-horizon/mafia-game/commit/20af250c1560248295cd176d4da29cd8503546c2))
* GM can kick players in lobby (X button next to name) ([a3ef909](https://github.com/giraffe-horizon/mafia-game/commit/a3ef909ff5f5007de7f1a45bb640aa6541eba150))
* GM can submit actions on behalf of players ([6c3afda](https://github.com/giraffe-horizon/mafia-game/commit/6c3afdacec1b073ffbbc605f08318fedc017503a))
* GM settings, mission management, mission status for players ([bcc11f9](https://github.com/giraffe-horizon/mafia-game/commit/bcc11f9eae5b7ab0799f5185acaed61d33a7bb1a))
* improve game UI and add player rename functionality ([5cd5cd6](https://github.com/giraffe-horizon/mafia-game/commit/5cd5cd6772854b285bd2b13f13126d3fa092bf44))
* live vote tally during voting phase — progress bars, vote count, leader ([42b95e0](https://github.com/giraffe-horizon/mafia-game/commit/42b95e0d25cd89fdc888e1964a6b47205bf229b2))
* mafia sees team votes during night & voting (Twoja rodzina) ([f747472](https://github.com/giraffe-horizon/mafia-game/commit/f7474728137fcb53e535aa0e21db53f90917c9ce))
* migrate to Next.js 16 + @opennextjs/cloudflare ([01793c5](https://github.com/giraffe-horizon/mafia-game/commit/01793c5eb0b3445d644d03dcbaddfdbe70c79c78))
* mission review phase before game end — GM must rate pending missions ([8eace60](https://github.com/giraffe-horizon/mafia-game/commit/8eace60cd0e5b487a7301c8698841418114abcd7))
* MVP etap 1 — landing, lobby, role, polling ([29e53bb](https://github.com/giraffe-horizon/mafia-game/commit/29e53bbf448ed3179d97a9971b9f2e8cb832d04c))
* per-session ranking with live updates, accessible from game view ([4cbc803](https://github.com/giraffe-horizon/mafia-game/commit/4cbc803a357c369aa2d6a1c4858bd33d927a1df9))
* share link button (Web Share API + clipboard fallback) ([f54a161](https://github.com/giraffe-horizon/mafia-game/commit/f54a1616c56e9637b4c130a028f4c83d3356342d))
* simple mode (mafia vs civilians, min 2 players, no special roles) ([58de477](https://github.com/giraffe-horizon/mafia-game/commit/58de4779864c608530983fe004880e1ab3295405))
* SMS-style code input (6 separate fields, auto-focus, paste support) ([e1c748c](https://github.com/giraffe-horizon/mafia-game/commit/e1c748c02228340fe4231f53647e78cd0fc618fb))
