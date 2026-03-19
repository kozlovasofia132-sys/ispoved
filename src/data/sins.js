// Profile type: 'adult' | 'child' | 'monastic'
let currentProfile = localStorage.getItem('profile') || 'adult';

/**
 * Set current profile
 * @param {string} profile - Profile type
 */
export function setProfile(profile) {
    currentProfile = profile;
    localStorage.setItem('profile', profile);
}

/**
 * Get current profile
 * @returns {string} Current profile type
 */
export function getProfile() {
    return currentProfile;
}

// Adult sins (default, full list)
const adultSins = [
    {
        id: 'god',
        titleKey: 'cat_god_title',
        subtitleKey: 'cat_god_subtitle',
        title: { ru: 'Против Бога', uk: 'Проти Бога', en: 'Against God' },
        subtitle: { ru: 'I. ОТНОШЕНИЯ', uk: 'I. ВІДНОСИНИ', en: 'I. RELATIONSHIPS' },
        icon: 'church',
        image: '/bg-god.png',
        sins: [
            { id: 'god_1', text: { ru: 'Маловерие и сомнение в истинах веры', uk: 'Маловір’я та сумнів у істинах віри', en: 'Lack of faith and doubt in the truths of faith' }, explanation: { ru: 'Периодические сомнения в существовании Бога, Его промысле или учениях Церкви.', uk: 'Періодичні сумніви в існуванні Бога, Його промислі або вченнях Церкви.', en: 'Periodic doubts about the existence of God, His providence, or Church teachings.' } },
            { id: 'god_2', text: { ru: 'Ропот на Бога в трудных обстоятельствах', uk: 'Нарікання на Бога у важких обставинах', en: 'Murmuring against God in difficult circumstances' }, explanation: { ru: 'Недовольство жизнью, обвинение Бога в бедах вместо смирения.', uk: 'Невдоволення життям, звинувачення Бога в бідах замість смирення.', en: 'Dissatisfaction with life, blaming God for troubles instead of humility.' } },
            { id: 'god_3', text: { ru: 'Неблагодарность Богу за Его милости', uk: 'Невдячність Богові за Його милості', en: 'Ingratitude to God for His mercies' }, explanation: { ru: 'Восприятие блага как должного, отсутствие благодарственной молитвы.', uk: 'Сприйняття блага як належного, відсутність подячної молитви.', en: 'Taking blessings for granted, lack of prayers of thanksgiving.' } },
            { id: 'god_4', text: { ru: 'Пропуск воскресных и праздничных богослужений', uk: 'Пропуск недільних та святкових богослужінь', en: 'Missing Sunday and feast day services' }, explanation: { ru: 'Лень или мирские дела мешают посещать храм в дни, посвященные Богу.', uk: 'Лінь або мирські справи заважають відвідувати храм у дні, присвячені Богу.', en: 'Laziness or worldly affairs preventing church attendance on days dedicated to God.' } },
            { id: 'god_5', text: { ru: 'Небрежная, поспешная или редкая молитва', uk: 'Недбала, поспішна або рідкісна молитва', en: 'Negligent, hasty, or rare prayer' }, explanation: { ru: 'Чтение правила второпях, без благоговения, откладывание из-за усталости.', uk: 'Читання правила поспіхом, без благоговіння, відкладання через втому.', en: 'Reading the rule in a hurry, without reverence, postponing due to fatigue.' } },
            { id: 'god_6', text: { ru: 'Божба (упоминание имени Бога всуе)', uk: 'Божба (згадування імені Бога даремно)', en: 'Taking God’s name in vain' }, explanation: { ru: 'Произнесение святого имени в шутках, пустых разговорах или эмоциях.', uk: 'Вимова святого імені в жартах, порожніх розмовах або емоціях.', en: 'Uttering the holy name in jokes, empty conversations, or emotions.' } },
            { id: 'god_7', text: { ru: 'Суеверие, вера в приметы и гороскопы', uk: 'Забобони, віра в прикмети та гороскопи', en: 'Superstition, belief in omens and horoscopes' }, explanation: { ru: 'Доверие астрологии, приметам или магии больше, чем Богу.', uk: 'Довіра астрології, прикметам або магії більше, ніж Богу.', en: 'Trusting astrology, omens, or magic more than God.' } },
            { id: 'god_8', text: { ru: 'Обращение к гадалкам, экстрасенсам, магам', uk: 'Звернення до ворожок, екстрасенсів, магів', en: 'Turning to fortunetellers, psychics, or magicians' }, severity: 'serious', explanation: { ru: 'Сектантство и «духовные практики»: Увлечение восточными медитациями, картами Таро, нумерологией.', uk: 'Сектантство та «духовні практики»: Захоплення східними медитаціями, картами Таро, нумерологією.', en: 'Sectarianism and "spiritual practices": Infatuation with Eastern meditations, Tarot cards, numerology.' } },
            { id: 'god_9', text: { ru: 'Несоблюдение установленных Церковью постов', uk: 'Недотримання встановлених Церквою постів', en: 'Failure to observe Church fasts' }, explanation: { ru: 'Пищевое или духовное нарушение поста без уважительной причины.', uk: 'Харчове або духовне порушення посту без поважної причини.', en: 'Dietary or spiritual breaking of the fast without a valid reason.' } },
            { id: 'god_10', text: { ru: 'Чтение литературы, направленной против веры', uk: 'Читання літератури, спрямованої проти віри', en: 'Reading literature directed against the faith' }, explanation: { ru: 'Увлечение материалами, разрушающими духовный фундамент человека.', uk: 'Захоплення матеріалами, що руйнують духовний фундамент людини.', en: 'Reading materials that destroy the spiritual foundation of a person.' } },
            { id: 'god_11', text: { ru: 'Утаивание грехов на исповеди', uk: 'Приховування гріхів на сповіді', en: 'Concealing sins at confession' }, severity: 'serious', explanation: { ru: 'Сознательное замалчивание серьезных грехов из-за стыда.', uk: 'Свідоме замовчування серйозних гріхів через сором.', en: 'Consciously hiding serious sins out of shame.' } },
            { id: 'god_12', text: { ru: 'Причащение Святых Таин без должного приготовления', uk: 'Причастя Святих Таїн без належного приготування', en: 'Receiving Holy Communion without due preparation' }, explanation: { ru: 'Дерзновенный подход к Чаше без поста, молитвы и примирения.', uk: 'Зухвалий підхід до Чаші без посту, молитви і примирення.', en: 'Boldly approaching the Chalice without fasting, prayer, and reconciliation.' } },
            { id: 'god_13', text: { ru: 'Клятвопреступление (нарушение обетов)', uk: 'Порушення обітниць', en: 'Perjury (breaking vows)' }, severity: 'serious', explanation: { ru: 'Невыполнение обещаний, данных Богу или людям перед святыней.', uk: 'Невиконання обіцянок, даних Богу або людям перед святинею.', en: 'Failure to keep promises made to God or people before a holy object.' } },
            { id: 'god_14', text: { ru: 'Отчаяние в милосердии Божием', uk: 'Відчай у милосерді Божому', en: 'Despair of God’s mercy' }, severity: 'serious', explanation: { ru: 'Потеря надежды на спасение, мысли о непростительности своих грехов.', uk: 'Втрата надії на порятунок, думки про непрощенність своїх гріхів.', en: 'Loss of hope for salvation, thoughts of the unforgivability of one\'s sins.' } },
            { id: 'god_15', text: { ru: 'Излишнее самонадеяние на свои силы', uk: 'Зайва самовпевненість у своїх силах', en: 'Excessive self-reliance' }, explanation: { ru: 'Уверенность, что можно побороть грех без помощи Божьей благодати.', uk: 'Впевненість, що можна побороти гріх без допомоги Божої благодаті.', en: 'Belief that sin can be overcome without the help of God\'s grace.' } },
            { id: 'god_16', text: { ru: 'Гнев на Бога', uk: 'Гнів на Бога', en: 'Anger at God' }, explanation: { ru: 'Внутренний бунт, обида на Творца за жизненные скорби.', uk: 'Внутрішній бунт, образа на Творця за життєві скорботи.', en: 'Internal rebellion, resentment against the Creator for life\'s sorrows.' } },
            { id: 'god_17', text: { ru: 'Смущение и неверие во время молитвы', uk: 'Збентеження та невір’я під час молитви', en: 'Confusion and disbelief during prayer' }, explanation: { ru: 'Допущение хульных или сомневающихся мыслей во время общения с Богом.', uk: 'Допущення хульних або сумнівних думок під час спілкування з Богом.', en: 'Allowing blasphemous or doubtful thoughts while communicating with God.' } },
            { id: 'god_18', text: { ru: 'Отношение к духовной жизни как к формальности', uk: 'Ставлення до духовного життя як до формальності', en: 'Treating spiritual life as a formality' }, explanation: { ru: 'Участие в Таинствах ради «галочки», без сердечного чувства.', uk: 'Участь у Таїнствах заради «галочки», без сердечного почуття.', en: 'Participation in Sacraments for the sake of checking a box, without genuine feeling.' } },
            { id: 'god_19', text: { ru: 'Человекоугодие вместо богоугодия', uk: 'Людинодогідництво замість богодогідництва', en: 'Pleasing men instead of pleasing God' }, explanation: { ru: 'Страх нарушить заповедь меньше, чем страх человеческого осуждения.', uk: 'Страх порушити заповідь менший, ніж страх людського осуду.', en: 'Fear of breaking a commandment is less than the fear of human judgment.' } },
            { id: 'god_20', text: { ru: 'Кощунство и святотатство', uk: 'Кощунство та святотатство', en: 'Blasphemy and sacrilege' }, severity: 'serious', explanation: { ru: 'Кощунство — это неуважительное отношение к святыням, иконам, кресту.', uk: 'Кощунство — це неповажне ставлення до святинь, ікон, хреста.', en: 'Blasphemy is a disrespectful attitude toward holy objects, icons, the cross.' } },
            { id: 'god_21', text: { ru: 'Отсутствие страха Божьего', uk: 'Відсутність страху Божого', en: 'Lack of fear of God' }, explanation: { ru: 'Отношение к Богу как к «обслуживающему персоналу» (просьбы только о земном/материальном).', uk: 'Ставлення до Бога як до «обслуговуючого персоналу» (прохання лише про земне/матеріальне).', en: 'Attitude toward God as "service personnel" (requests only for earthly/material things).' } },
            { id: 'god_22', text: { ru: 'Оправдание своих грехов', uk: 'Виправдання своїх гріхів', en: 'Justifying one\'s sins' }, explanation: { ru: 'Поиск виноватых (дьявол, обстоятельства, другие люди) вместо признания своей вины.', uk: 'Пошук винних (диявол, обставини, інші люди) замість визнання своєї провини.', en: 'Seeking someone to blame (the devil, circumstances, other people) instead of admitting one\'s guilt.' } },
            { id: 'god_23', text: { ru: 'Сомнение в спасительности Церкви', uk: 'Сумнів у спасительності Церкви', en: 'Doubt in the salvific nature of the Church' }, explanation: { ru: 'Считаю себя «верующим в душе», но отрицаю необходимость Таинств.', uk: 'Вважаю себе «віруючим у душі», але заперечую необхідність Таїнств.', en: 'Considering oneself "believing in the soul" but denying the necessity of the Sacraments.' } }
        ]
    },
    {
        id: 'neighbors',
        titleKey: 'cat_neighbors_title',
        subtitleKey: 'cat_neighbors_subtitle',
        title: { ru: 'Против ближнего', uk: 'Проти ближнього', en: 'Against neighbor' },
        subtitle: { ru: 'II. БЛИЖНИЕ', uk: 'II. БЛИЖНІ', en: 'II. NEIGHBORS' },
        icon: 'people',
        image: '/bg-neighbor.png',
        sins: [
            { id: 'neighbor_1', text: { ru: 'Осуждение и злословие других людей', uk: 'Осуд та лихослів’я інших людей', en: 'Judging and slandering other people' }, explanation: { ru: 'Перемывание косточек, вынесение суда над поступками других.', uk: 'Перемивання кісточок, винесення суду над вчинками інших.', en: 'Gossiping, passing judgment on the actions of others.' } },
            { id: 'neighbor_2', text: { ru: 'Гнев, раздражение и грубость в общении', uk: 'Гнів, роздратування та грубість у спілкуванні', en: 'Anger, irritation and rudeness in communication' }, explanation: { ru: 'Потеря самоконтроля, крик, язвительные замечания в адрес близких.', uk: 'Втрата самоконтролю, крик, уїдливі зауваження на адресу близьких.', en: 'Loss of self-control, yelling, sarcastic remarks towards loved ones.' } },
            { id: 'neighbor_3', text: { ru: 'Неуважение и непослушание родителям', uk: 'Неповага та непослух батькам', en: 'Disrespect and disobedience to parents' }, explanation: { ru: 'Грубость к старшим, игнорирование их просьб, отсутствие заботы.', uk: 'Грубість до старших, ігнорування їхніх прохань, відсутність турботи.', en: 'Rudeness to elders, ignoring their requests, lack of care.' } },
            { id: 'neighbor_4', text: { ru: 'Ложь, обман и лукавство', uk: 'Брехня, обман та лукавство', en: 'Lying, deceit and guile' }, explanation: { ru: 'Искажение правды, хитрость, лицемерие ради собственной выгоды.', uk: 'Спотворення правди, хитрість, лицемірство заради власної вигоди.', en: 'Distortion of truth, cunning, hypocrisy for one\'s own benefit.' } },
            { id: 'neighbor_5', text: { ru: 'Обидчивость и нежелание прощать', uk: 'Образливість та небажання прощати', en: 'Taking offense and unwillingness to forgive' }, explanation: { ru: 'Долгое ношение обиды в сердце, злопамятность.', uk: 'Довге носіння образи в серці, злопам\'ятність.', en: 'Holding a grudge in the heart for a long time, vindictiveness.' } },
            { id: 'neighbor_6', text: { ru: 'Зависть к успехам или имуществу других', uk: 'Заздрість до успіхів або майна інших', en: 'Envy of others’ success or property' }, explanation: { ru: 'Огорчение из-за чужого блага, тайное желание неудач знакомым.', uk: 'Смуток через чуже благо, таємне бажання невдач знайомим.', en: 'Grief over someone else\'s blessing, secret desire for failure of acquaintances.' } },
            { id: 'neighbor_7', text: { ru: 'Скупость и отказ в помощи нуждающимся', uk: 'Скупість та відмова в допомоги нужденним', en: 'Stinginess and refusal to help those in need' }, explanation: { ru: 'Жалость расстаться с деньгами или временем ради ближнего.', uk: 'Жаль розлучатися з грошима або часом заради ближнього.', en: 'Reluctance to part with money or time for a neighbor.' } },
            { id: 'neighbor_8', text: { ru: 'Гордость и высокомерие по отношению к людям', uk: 'Гордість та зарозумілість по відношенню к людям', en: 'Pride and arrogance toward people' }, explanation: { ru: 'Презрительное отношение к тем, кто ниже по статусу или уму.', uk: 'Презирливе ставлення до тих, хто нижчий за статусом або розумом.', en: 'Contemptuous attitude towards those lower in status or intellect.' } },
            { id: 'neighbor_9', text: { ru: 'Сплетни и клевета', uk: 'Плітки та наклеп', en: 'Gossip and slander' }, explanation: { ru: 'Распространение слухов, подрыв чужой репутации.', uk: 'Поширення чуток, підрив чужої репутації.', en: 'Spreading rumors, undermining someone else\'s reputation.' } },
            { id: 'neighbor_10', text: { ru: 'Ревность и подозрительность', uk: 'Ревнощі та підозрілість', en: 'Jealousy and suspiciousness' }, explanation: { ru: 'Контроль каждого шага супруга, недоверие без повода.', uk: 'Контроль кожного кроку чоловіка/дружини, недовіра без приводу.', en: 'Controlling every step of a spouse, distrust without reason.' } },
            { id: 'neighbor_11', text: { ru: 'Огорчение близких своим поведением', uk: 'Засмучення близьких своєю поведінкою', en: 'Grieving loved ones by one’s behavior' }, explanation: { ru: 'Эгоистичные поступки, заставляющие переживать семью.', uk: 'Егоїстичні вчинки, що змушують переживати сім\'ю.', en: 'Selfish actions making family worry.' } },
            { id: 'neighbor_12', text: { ru: 'Желание зла или проклятие кого-либо', uk: 'Бажання зла або прокляття кого-небудь', en: 'Wishing ill or cursing anyone' }, severity: 'serious', explanation: { ru: 'Пожелание болезни или несчастья в порыве гнева.', uk: 'Побажання хвороби або нещастя в пориві гніву.', en: 'Wishing illness or misfortune in a fit of anger.' } },
            { id: 'neighbor_13', text: { ru: 'Скупость времени и внимания для близких', uk: 'Скупість часу та уваги для близьких', en: 'Stinginess with time and attention for loved ones' }, explanation: { ru: 'Физически дома, но духовно и мысленно далеко (в телефоне, работе).', uk: 'Фізично вдома, але духовно і подумки далеко (в телефоні, роботі).', en: 'Physically at home, but spiritually and mentally far away (in phone, work).' } },
            { id: 'neighbor_14', text: { ru: 'Нарушение мира в семье или коллективе', uk: 'Порушення миру в сім’ї або колективі', en: 'Disturbing the peace in family or community' }, explanation: { ru: 'Разжигание ссор, провокации, неумение уступать.', uk: 'Розпалювання сварок, провокації, невміння поступатися.', en: 'Inciting quarrels, provocations, inability to yield.' } },
            { id: 'neighbor_15', text: { ru: 'Хищение, присвоение чужого (даже малого)', uk: 'Крадіжка, привласнення чужого (навіть малого)', en: 'Theft, appropriation of others’ property (even small things)' }, severity: 'serious', explanation: { ru: 'Кража, невозврат долгов, использование рабочего в личных целях.', uk: 'Крадіжка, неповернення боргів, використання робочого в особистих цілях.', en: 'Stealing, not repaying debts, using work property for personal goals.' } },
            { id: 'neighbor_16', text: { ru: 'Нерадение о воспитании детей в вере', uk: 'Недбалість у вихованні дітей у вірі', en: 'Negligence in raising children in the faith' }, explanation: { ru: 'Забота лишь о телесном развитии ребенка, пренебрежение душой.', uk: 'Турбота лише про тілесний розвиток дитини, нехтування душею.', en: 'Caring only for the physical development of the child, neglecting the soul.' } },
            { id: 'neighbor_17', text: { ru: 'Измена (словом, делом или помыслом)', uk: 'Зрада (словом, ділом або думкою)', en: 'Betrayal (in word, deed, or thought)' }, severity: 'serious', explanation: { ru: 'Нарушение верности супругу (супруге), флирт на стороне.', uk: 'Порушення вірності чоловікові (дружині), флірт на стороні.', en: 'Violation of fidelity to spouse, flirting on the side.' } },
            { id: 'neighbor_18', text: { ru: 'Жестокосердие к животным и природе', uk: 'Жорстокосердя до тварин та природи', en: 'Cruelty to animals and nature' }, explanation: { ru: 'Издевательство над животными, варварское отношение к экологии.', uk: 'Знущання над тваринами, варварське ставлення до екології.', en: 'Cruelty to animals, barbaric attitude towards ecology.' } },
            { id: 'neighbor_19', text: { ru: 'Лицемерие (желание казаться лучше, чем есть)', uk: 'Лицемірство (бажання здаватися кращим, ніж є)', en: 'Hypocrisy (wanting to appear better than one is)' }, explanation: { ru: 'Создание образа «идеального» человека при внутренней пустоте.', uk: 'Створення образу «ідеального» людини при внутрішній порожнечі.', en: 'Creating an image of a "perfect" person with internal emptiness.' } },
            { id: 'neighbor_20', text: { ru: 'Невыполнение данных обещаний и долгов', uk: 'Невиконання даних обіцянок та боргів', en: 'Failure to keep promises and pay debts' }, explanation: { ru: 'Безответственное отношение к слову, подведение доверившихся.', uk: 'Безвідповідальне ставлення до слова, підведення тих, хто довірився.', en: 'Irresponsible attitude to one\'s word, letting down those who trusted.' } },
            { id: 'neighbor_21', text: { ru: 'Отсутствие милосердия в сети', uk: 'Відсутність милосердя в мережі', en: 'Lack of mercy online' }, explanation: { ru: 'Агрессивные комментарии в интернете, «троллинг», «хейт».', uk: 'Агресивні коментарі в інтернеті, «тролінг», «хейт».', en: 'Aggressive comments on the internet, "trolling", "hate".' } },
            { id: 'neighbor_22', text: { ru: 'Информационная нечистоплотность', uk: 'Інформаційна неохайність', en: 'Information impurity' }, explanation: { ru: 'Распространение сплетен, фейков, непроверенной информации о людях.', uk: 'Поширення пліток, фейків, неперевіреної інформації про людей.', en: 'Spreading gossip, fakes, unverified information about people.' } },
            { id: 'neighbor_23', text: { ru: 'Эгоизм в семье', uk: 'Егоїзм у сім’ї', en: 'Egoism in the family' }, explanation: { ru: 'Ожидание, что все должны подстраиваться под мой комфорт.', uk: 'Очікування, що всі повинні підлаштовуватися під мій комфорт.', en: 'Expecting everyone to adapt to my comfort.' } },
            { id: 'neighbor_24', text: { ru: 'Пренебрежение к пожилым или больным', uk: 'Зневага до людей похилого віку або хворих', en: 'Neglect of the elderly or sick' }, explanation: { ru: 'Нехватка терпения, раздражение на их немощи.', uk: 'Брак терпіння, роздратування через їхні немочі.', en: 'Lack of patience, irritation at their infirmities.' } },
            { id: 'neighbor_25', text: { ru: 'Горделивое учительство', uk: 'Гордовите вчительство', en: 'Proud teaching' }, explanation: { ru: 'Желание всех «поучать» и навязывать свою точку зрения, не имея на то любви и права.', uk: 'Бажання всіх «повчати» і нав’язувати свою точку зору, не маючи на те любові та права.', en: 'Desire to "teach" everyone and impose one\'s point of view without having love or the right to do so.' } },
            { id: 'neighbor_26', text: { ru: 'Неблагодарность близким', uk: 'Невдячність близьким', en: 'Ingratitude to loved ones' }, explanation: { ru: 'Забываю сказать «спасибо» за их труд (приготовленный ужин, помощь).', uk: 'Забуваю сказати «дякую» за їхню працю (приготована вечеря, допомога).', en: 'Forgetting to say "thank you" for their labor (cooked dinner, help).' } }
        ]
    },
    {
        id: 'self',
        titleKey: 'cat_self_title',
        subtitleKey: 'cat_self_subtitle',
        title: { ru: 'Против себя', uk: 'Проти себе', en: 'Against self' },
        subtitle: { ru: 'III. ЛИЧНОСТЬ', uk: 'III. ОСОБИСТІСТЬ', en: 'III. PERSONALITY' },
        icon: 'person',
        image: '/bg-self.png',
        sins: [
            { id: 'self_1', text: { ru: 'Гордость и тщеславие (любование собой)', uk: 'Гордість та марнославство (милування собою)', en: 'Pride and vainglory (self-admiration)' }, explanation: { ru: 'Внутреннее любование своими успехами, ожидание похвалы от других.', uk: 'Внутрішнє милування своїми успіхами, очікування похвали від інших.', en: 'Internal admiration of one\'s successes, expecting praise from others.' } },
            { id: 'self_2', text: { ru: 'Уныние, печаль и лень', uk: 'Зневіра, сум та лінь', en: 'Despondency, sorrow and laziness' }, severity: 'serious', explanation: { ru: 'Хроническая апатия, опускание рук при малейших трудностях.', uk: 'Хронічна апатія, опускання рук при найменших труднощах.', en: 'Chronic apathy, giving up at the slightest difficulties.' } },
            { id: 'self_3', text: { ru: 'Чревоугодие, пьянство и курение', uk: 'Черевоугодництво, пияцтво та куріння', en: 'Gluttony, drunkenness and smoking' }, explanation: { ru: 'Порабощение себя еде, табаку или алкоголю.', uk: 'Поневолення себе їжі, тютюну або алкоголю.', en: 'Enslavement to food, tobacco, or alcohol.' } },
            { id: 'self_4', text: { ru: 'Празднословие (пустые разговоры)', uk: 'Марнослів’я (порожні розмови)', en: 'Idle talk (empty conversations)' }, explanation: { ru: 'Многочасовые разговоры ни о чем, отсекающие время на полезное.', uk: 'Багатогодинні розмови ні про що, що відсікають час на корисне.', en: 'Hours of conversations about nothing, cutting off time for useful things.' } },
            { id: 'self_5', text: { ru: 'Нечистые помыслы и блудные мечтания', uk: 'Нечисті помисли та блудні мріяння', en: 'Unclean thoughts and lustful fantasies' }, explanation: { ru: 'Удержание в уме блудных фантазий, развратных представлений.', uk: 'Утримання в думці блудних фантазій, розпусних уявлень.', en: 'Dwelling on lustful fantasies, depraved representations in mind.' } },
            { id: 'self_6', text: { ru: 'Гнев на самого себя (самоедство)', uk: 'Гнів на самого себе', en: 'Anger at oneself (self-torment)' }, explanation: { ru: 'Бесконечное самоосуждение, не позволяющее поверить в Божье прощение.', uk: 'Нескінченне самоосуд, що не дозволяє повірити в Боже прощення.', en: 'Endless self-condemnation, not allowing to believe in God\'s forgiveness.' } },
            { id: 'self_7', text: { ru: 'Трата времени на пустые развлечения', uk: 'Марнування часу на порожні розваги', en: 'Wasting time on empty entertainment' }, explanation: { ru: 'Пристрастие к сериалам, играм или соцсетям в ущерб душе и семье.', uk: 'Пристрасть до серіалів, ігор або соцмереж на шкоду душі та сім\'ї.', en: 'Addiction to series, games, or social networks to the detriment of soul and family.' } },
            { id: 'self_8', text: { ru: 'Сребролюбие и пристрастие к вещам', uk: 'Сріблолюбство та пристрасть до речей', en: 'Love of money and attachment to things' }, explanation: { ru: 'Развитие жадности, болезненная привязанность к комфорту.', uk: 'Розвиток жадібності, хвороблива прихильність до комфорту.', en: 'Developing greed, unhealthy attachment to comfort.' } },
            { id: 'self_9', text: { ru: 'Ложный стыд (боязнь показаться верующим)', uk: 'Хибний сором (боязнь здатися віруючим)', en: 'False shame (fear of appearing religious)' }, explanation: { ru: 'Стеснение своей веры перед светским обществом.', uk: 'Сором своєї віри перед світським суспільством.', en: 'Embarrassment of one\'s faith in front of secular society.' } },
            { id: 'self_10', text: { ru: 'Небрежность к своему здоровью', uk: 'Недбалість до свого здоров’я', en: 'Negligence toward one’s health' }, explanation: { ru: 'Разрушение тела (храма духа) перегрузками и недостатком ухода.', uk: 'Руйнування тіла (храму духу) перевантаженнями і недоліком догляду.', en: 'Destroying the body (temple of the spirit) through stress and lack of care.' } },
            { id: 'self_11', text: { ru: 'Самомнение и надежда только на себя', uk: 'Самомніння та надія лише на себе', en: 'High self-opinion and reliance only on oneself' }, explanation: { ru: 'Твердая убежденность в собственной непогрешимости.', uk: 'Тверда переконаність у власній непогрішності.', en: 'Firm belief in one\'s own infallibility.' } },
            { id: 'self_12', text: { ru: 'Гнилые слова и матерная брань', uk: 'Гнилі слова та матірна лайка', en: 'Foul words and obscene swearing' }, explanation: { ru: 'Употребление матерных и оскорбительных слов.', uk: 'Вживання матірних і образливих слів.', en: 'Using obsessive and offensive words.' } },
            { id: 'self_13', text: { ru: 'Осквернение себя непристойными зрелищами', uk: 'Осквернення себе непристойними видовищами', en: 'Defiling oneself with indecent spectacles' }, severity: 'serious', explanation: { ru: 'Просмотр порнографии, эротики, развращающего контента.', uk: 'Перегляд порнографії, еротики, розтліваючого контенту.', en: 'Watching pornography, erotica, corrupting content.' } },
            { id: 'self_14', text: { ru: 'Употребление дурманящих средств', uk: 'Вживання дурманних засобів', en: 'Use of intoxicating substances' }, severity: 'serious', explanation: { ru: 'Прием наркотиков или изменяющих сознание веществ.', uk: 'Прийом наркотиків або речовин, що змінюють свідомість.', en: 'Taking drugs or mind-altering substances.' } },
            { id: 'self_15', text: { ru: 'Праздность и нежелание трудиться', uk: 'Порожність та небажання працювати', en: 'Idleness and unwillingness to work' }, explanation: { ru: 'Уклонение от работы, желание жить за счет других.', uk: 'Ухилення від роботи, бажання жити за рахунок інших.', en: 'Avoiding work, desire to live at the expense of others.' } },
            { id: 'self_16', text: { ru: 'Склонность к азартным играм', uk: 'Схильність до азартних ігор', en: 'Inclination toward gambling' }, explanation: { ru: 'Участие в казино, ставках на спорт.', uk: 'Участь у казино, ставках на спорт.', en: 'Participation in casinos, sports betting.' } },
            { id: 'self_17', text: { ru: 'Потеря смысла жизни и мысли о смерти', uk: 'Втрата сенсу життя та думки про смерть', en: 'Loss of meaning in life and thoughts of death' }, severity: 'serious', explanation: { ru: 'Допущение суицидальных мыслей, отказ от борьбы.', uk: 'Допущення суїцидальних думок, відмова від боротьби.', en: 'Allowing suicidal thoughts, refusal to fight.' } },
            { id: 'self_18', text: { ru: 'Излишняя забота о внешности', uk: 'Зайва турбота про зовнішність', en: 'Excessive concern for appearance' }, explanation: { ru: 'Уход за собой становится культом и главной целью.', uk: 'Догляд за собою стає культом і головною метою.', en: 'Self-care becomes a cult and main goal.' } },
            { id: 'self_19', text: { ru: 'Подозрительность и мнительность', uk: 'Підозрілість та мнивість', en: 'Suspiciousness and hypochondria' }, explanation: { ru: 'Маниакальный поиск во всем скрытых угроз и болезней.', uk: 'Маніакальний пошук у всьому прихованих загроз і хвороб.', en: 'Maniacal search for hidden threats and diseases in everything.' } },
            { id: 'self_20', text: { ru: 'Нерадение о спасении своей души', uk: 'Недбалість про спасіння своєї душі', en: 'Negligence about the salvation of one’s soul' }, explanation: { ru: 'Погружение в суету без единой мысли о покаянии.', uk: 'Занурення в суєту без жодної думки про покаяння.', en: 'Immersion in vanity without a single thought of repentance.' } },
            { id: 'self_21', text: { ru: 'Цифровая зависимость', uk: 'Цифрова залежність', en: 'Digital addiction' }, explanation: { ru: '«Зависание» в соцсетях, бесконечное пролистывание ленты, крадущее жизнь и молитву.', uk: '«Зависання» в соцмережах, нескінченне прогортання стрічки, що краде життя та молитву.', en: '"Hanging out" in social networks, endless scrolling of the feed, stealing life and prayer.' } },
            { id: 'self_22', text: { ru: 'Культ потребления', uk: 'Культ споживання', en: 'Consumerist cult' }, explanation: { ru: 'Покупка ненужных вещей ради престижа или «заедания» стресса.', uk: 'Купівля непотрібних речей заради престижу або «заїдання» стресу.', en: 'Buying unnecessary things for the sake of prestige or "eating away" stress.' } },
            { id: 'self_23', text: { ru: 'Неверие в свои силы побороть грех', uk: 'Невіра у свої сили подолати гріх', en: 'Disbelief in one\'s power to overcome sin' }, explanation: { ru: '«Я всё равно не исправлюсь, зачем стараться?» (уныние в борьбе с собой).', uk: '«Я все одно не виправлюся, навіщо старатися?» (зневіра в боротьбі з собою).', en: '"I won\'t improve anyway, why try?" (despondency in the struggle with oneself).' } },
            { id: 'self_24', text: { ru: 'Тщеславие добрыми делами', uk: 'Марнославство добрими справами', en: 'Vainglory by good deeds' }, explanation: { ru: 'Желание, чтобы другие заметили мою «святость» или мои добрые поступки.', uk: 'Бажання, щоб інші помітили мою «святість» або мої добрі вчинки.', en: 'Desire for others to notice my "holiness" or my good deeds.' } },
            { id: 'self_25', text: { ru: 'Грехи мысли', uk: 'Гріхи думки', en: 'Sins of thought' }, explanation: { ru: 'Смакование грязных мыслей, фантазии о мести или греховных наслаждениях.', uk: 'Смакування брудних думок, фантазії про помсту або гріховні насолоди.', en: 'Savoring dirty thoughts, fantasies of revenge or sinful pleasures.' } },
            { id: 'self_26', text: { ru: 'Разбазаривание талантов', uk: 'Розбазарювання талантів', en: 'Wasting of talents' }, explanation: { ru: 'Лень развивать свои способности, данные Богом.', uk: 'Лінь розвивати свої здібності, дані Богом.', en: 'Laziness in developing one\'s abilities given by God.' } }
        ]
    }
];

// Teen sins (same as child for now)
const teenSins = childSins;

// Child sins (simplified, age-appropriate)
const childSins = [
    {
        id: 'god',
        titleKey: 'cat_god_title',
        subtitleKey: 'cat_god_subtitle',
        title: { ru: 'Против Бога', uk: 'Проти Бога', en: 'Against God' },
        subtitle: { ru: 'I. ОТНОШЕНИЯ', uk: 'I. ВІДНОСИНИ', en: 'I. RELATIONSHIPS' },
        icon: 'church',
        image: '/bg-god.png',
        sins: [
            { id: 'god_1', text: { ru: 'Забыл помолиться утром или вечером', uk: 'Забув помолитися вранці або ввечері', en: 'Forgot to pray morning or evening' } },
            { id: 'god_2', text: { ru: 'Не хотел идти в храм', uk: 'Не хотів йти до храму', en: 'Did not want to go to church' } },
            { id: 'god_3', text: { ru: 'Божился или упоминал Бога всуе', uk: 'Божився або згадував Бога даремно', en: 'Took God\'s name in vain' } },
            { id: 'god_4', text: { ru: 'Смеялся в церкви или разговаривал', uk: 'Сміявся в церкві або розмовляв', en: 'Laughed or talked in church' } },
            { id: 'god_5', text: { ru: 'Боялся креститься или носить крестик', uk: 'Боявся хреститися або носити хрестик', en: 'Was afraid to cross myself or wear my cross' } }
        ]
    },
    {
        id: 'neighbors',
        titleKey: 'cat_neighbors_title',
        subtitleKey: 'cat_neighbors_subtitle',
        title: { ru: 'Против ближнего', uk: 'Проти ближнього', en: 'Against neighbor' },
        subtitle: { ru: 'II. БЛИЖНИЕ', uk: 'II. БЛИЖНІ', en: 'II. NEIGHBORS' },
        icon: 'people',
        image: '/bg-neighbor.png',
        sins: [
            { id: 'neighbor_1', text: { ru: 'Не слушался родителей', uk: 'Не слухався батьків', en: 'Did not obey parents' } },
            { id: 'neighbor_2', text: { ru: 'Грубил или кричал на родителей', uk: 'Грубив або кричав на батьків', en: 'Was rude or yelled at parents' } },
            { id: 'neighbor_3', text: { ru: 'Дрался или обзывал других', uk: 'Бився або обзивав інших', en: 'Fought or called others names' } },
            { id: 'neighbor_4', text: { ru: 'Ябедничал или завидовал', uk: 'Ябедничав або заздрив', en: 'Tattled or was envious' } },
            { id: 'neighbor_5', text: { ru: 'Не поделился с другими', uk: 'Не поділився з іншими', en: 'Did not share with others' } },
            { id: 'neighbor_6', text: { ru: 'Обижал младших или слабых', uk: 'Ображав молодших або слабких', en: 'Bullied younger or weaker ones' } },
            { id: 'neighbor_7', text: { ru: 'Врал или обманывал', uk: 'Брехав або обманював', en: 'Lied or deceived' } }
        ]
    },
    {
        id: 'self',
        titleKey: 'cat_self_title',
        subtitleKey: 'cat_self_subtitle',
        title: { ru: 'Против себя', uk: 'Проти себе', en: 'Against self' },
        subtitle: { ru: 'III. Я', uk: 'III. Я', en: 'III. SELF' },
        icon: 'person',
        image: '/bg-self.png',
        sins: [
            { id: 'self_1', text: { ru: 'Ленился делать уроки или помогать дома', uk: 'Лінувався робити уроки або допомагати вдома', en: 'Was lazy doing homework or helping at home' } },
            { id: 'self_2', text: { ru: 'Много сидел в телефоне или компьютере', uk: 'Багато сидів у телефоні або комп\'ютері', en: 'Spent too much time on phone or computer' } },
            { id: 'self_3', text: { ru: 'Грубо разговаривал или ругался матом', uk: 'Грубо розмовляв або лаявся матом', en: 'Talked rudely or used bad words' } },
            { id: 'self_4', text: { ru: 'Жадничал или завидовал чужим вещам', uk: 'Жадібничав або заздрив чужим речам', en: 'Was greedy or envious of others\' things' } },
            { id: 'self_5', text: { ru: 'Тратил деньги на ненужные вещи', uk: 'Тратив гроші на непотрібні речі', en: 'Spent money on unnecessary things' } }
        ]
    }
];

/**
 * Get sins data based on current profile
 * @returns {Array} Sins data for current profile
 */
export const getSinsData = () => {
    if (currentProfile === 'child') {
        return childSins;
    }
    if (currentProfile === 'teen') {
        return teenSins;
    }
    // Default to adult (monastic uses same as adult for now)
    return adultSins;
};
