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
        title: { ru: 'Против Бога' },
        subtitle: { ru: 'I. ОТНОШЕНИЯ' },
        icon: 'church',
        image: '/bg-god.png',
        sins: [
            { id: 'god_1', text: { ru: 'Маловерие и сомнение в истинах веры' }, explanation: { ru: 'Периодические сомнения в существовании Бога, Его промысле или учениях Церкви.' } },
            { id: 'god_2', text: { ru: 'Ропот на Бога в трудных обстоятельствах' }, explanation: { ru: 'Недовольство жизнью, обвинение Бога в бедах вместо смирения.' } },
            { id: 'god_3', text: { ru: 'Неблагодарность Богу за Его милости' }, explanation: { ru: 'Восприятие блага как должного, отсутствие благодарственной молитвы.' } },
            { id: 'god_4', text: { ru: 'Пропуск воскресных и праздничных богослужений' }, explanation: { ru: 'Лень или мирские дела мешают посещать храм в дни, посвященные Богу.' } },
            { id: 'god_5', text: { ru: 'Небрежная, поспешная или редкая молитва' }, explanation: { ru: 'Чтение правила второпях, без благоговения, откладывание из-за усталости.' } },
            { id: 'god_6', text: { ru: 'Божба (упоминание имени Бога всуе)' }, explanation: { ru: 'Произнесение святого имени в шутках, пустых разговорах или эмоциях.' } },
            { id: 'god_7', text: { ru: 'Суеверие, вера в приметы и гороскопы' }, explanation: { ru: 'Доверие астрологии, приметам или магии больше, чем Богу.' } },
            { id: 'god_8', text: { ru: 'Обращение к гадалкам, экстрасенсам, магам' }, severity: 'serious', explanation: { ru: 'Сектантство и «духовные практики»: Увлечение восточными медитациями, картами Таро, нумерологией.' } },
            { id: 'god_9', text: { ru: 'Несоблюдение установленных Церковью постов' }, explanation: { ru: 'Пищевое или духовное нарушение поста без уважительной причины.' } },
            { id: 'god_10', text: { ru: 'Чтение литературы, направленной против веры' }, explanation: { ru: 'Увлечение материалами, разрушающими духовный фундамент человека.' } },
            { id: 'god_11', text: { ru: 'Утаивание грехов на исповеди' }, severity: 'serious', explanation: { ru: 'Сознательное замалчивание серьезных грехов из-за стыда.' } },
            { id: 'god_12', text: { ru: 'Причащение Святых Таин без должного приготовления' }, explanation: { ru: 'Дерзновенный подход к Чаше без поста, молитвы и примирения.' } },
            { id: 'god_13', text: { ru: 'Клятвопреступление (нарушение обетов)' }, severity: 'serious', explanation: { ru: 'Невыполнение обещаний, данных Богу или людям перед святыней.' } },
            { id: 'god_14', text: { ru: 'Отчаяние в милосердии Божием' }, severity: 'serious', explanation: { ru: 'Потеря надежды на спасение, мысли о непростительности своих грехов.', uk: 'Втрата надії на порятунок, думки про непрощенність своїх гріхів.', en: 'Loss of hope for salvation, thoughts of the unforgivability of one\'s sins.' } },
            { id: 'god_15', text: { ru: 'Излишнее самонадеяние на свои силы' }, explanation: { ru: 'Уверенность, что можно побороть грех без помощи Божьей благодати.', uk: 'Впевненість, що можна побороти гріх без допомоги Божої благодаті.', en: 'Belief that sin can be overcome without the help of God\'s grace.' } },
            { id: 'god_16', text: { ru: 'Гнев на Бога' }, explanation: { ru: 'Внутренний бунт, обида на Творца за жизненные скорби.', uk: 'Внутрішній бунт, образа на Творця за життєві скорботи.', en: 'Internal rebellion, resentment against the Creator for life\'s sorrows.' } },
            { id: 'god_17', text: { ru: 'Смущение и неверие во время молитвы' }, explanation: { ru: 'Допущение хульных или сомневающихся мыслей во время общения с Богом.' } },
            { id: 'god_18', text: { ru: 'Отношение к духовной жизни как к формальности' }, explanation: { ru: 'Участие в Таинствах ради «галочки», без сердечного чувства.' } },
            { id: 'god_19', text: { ru: 'Человекоугодие вместо богоугодия' }, explanation: { ru: 'Страх нарушить заповедь меньше, чем страх человеческого осуждения.' } },
            { id: 'god_20', text: { ru: 'Кощунство и святотатство' }, severity: 'serious', explanation: { ru: 'Кощунство — это неуважительное отношение к святыням, иконам, кресту.' } },
            { id: 'god_21', text: { ru: 'Отсутствие страха Божьего' }, explanation: { ru: 'Отношение к Богу как к «обслуживающему персоналу» (просьбы только о земном/материальном).' } },
            { id: 'god_22', text: { ru: 'Оправдание своих грехов', uk: 'Виправдання своїх гріхів', en: 'Justifying one\'s sins' }, explanation: { ru: 'Поиск виноватых (дьявол, обстоятельства, другие люди) вместо признания своей вины.', uk: 'Пошук винних (диявол, обставини, інші люди) замість визнання своєї провини.', en: 'Seeking someone to blame (the devil, circumstances, other people) instead of admitting one\'s guilt.' } },
            { id: 'god_23', text: { ru: 'Сомнение в спасительности Церкви' }, explanation: { ru: 'Считаю себя «верующим в душе», но отрицаю необходимость Таинств.' } }
        ]
    },
    {
        id: 'neighbors',
        titleKey: 'cat_neighbors_title',
        subtitleKey: 'cat_neighbors_subtitle',
        title: { ru: 'Против ближнего' },
        subtitle: { ru: 'II. БЛИЖНИЕ' },
        icon: 'people',
        image: '/bg-neighbor.png',
        sins: [
            { id: 'neighbor_1', text: { ru: 'Осуждение и злословие других людей' }, explanation: { ru: 'Перемывание косточек, вынесение суда над поступками других.' } },
            { id: 'neighbor_2', text: { ru: 'Гнев, раздражение и грубость в общении' }, explanation: { ru: 'Потеря самоконтроля, крик, язвительные замечания в адрес близких.' } },
            { id: 'neighbor_3', text: { ru: 'Неуважение и непослушание родителям' }, explanation: { ru: 'Грубость к старшим, игнорирование их просьб, отсутствие заботы.' } },
            { id: 'neighbor_4', text: { ru: 'Ложь, обман и лукавство' }, explanation: { ru: 'Искажение правды, хитрость, лицемерие ради собственной выгоды.', uk: 'Спотворення правди, хитрість, лицемірство заради власної вигоди.', en: 'Distortion of truth, cunning, hypocrisy for one\'s own benefit.' } },
            { id: 'neighbor_5', text: { ru: 'Обидчивость и нежелание прощать' }, explanation: { ru: 'Долгое ношение обиды в сердце, злопамятность.', uk: 'Довге носіння образи в серці, злопам\'ятність.', en: 'Holding a grudge in the heart for a long time, vindictiveness.' } },
            { id: 'neighbor_6', text: { ru: 'Зависть к успехам или имуществу других' }, explanation: { ru: 'Огорчение из-за чужого блага, тайное желание неудач знакомым.', uk: 'Смуток через чуже благо, таємне бажання невдач знайомим.', en: 'Grief over someone else\'s blessing, secret desire for failure of acquaintances.' } },
            { id: 'neighbor_7', text: { ru: 'Скупость и отказ в помощи нуждающимся' }, explanation: { ru: 'Жалость расстаться с деньгами или временем ради ближнего.' } },
            { id: 'neighbor_8', text: { ru: 'Гордость и высокомерие по отношению к людям' }, explanation: { ru: 'Презрительное отношение к тем, кто ниже по статусу или уму.' } },
            { id: 'neighbor_9', text: { ru: 'Сплетни и клевета' }, explanation: { ru: 'Распространение слухов, подрыв чужой репутации.', uk: 'Поширення чуток, підрив чужої репутації.', en: 'Spreading rumors, undermining someone else\'s reputation.' } },
            { id: 'neighbor_10', text: { ru: 'Ревность и подозрительность' }, explanation: { ru: 'Контроль каждого шага супруга, недоверие без повода.' } },
            { id: 'neighbor_11', text: { ru: 'Огорчение близких своим поведением' }, explanation: { ru: 'Эгоистичные поступки, заставляющие переживать семью.', uk: 'Егоїстичні вчинки, що змушують переживати сім\'ю.', en: 'Selfish actions making family worry.' } },
            { id: 'neighbor_12', text: { ru: 'Желание зла или проклятие кого-либо' }, severity: 'serious', explanation: { ru: 'Пожелание болезни или несчастья в порыве гнева.' } },
            { id: 'neighbor_13', text: { ru: 'Скупость времени и внимания для близких' }, explanation: { ru: 'Физически дома, но духовно и мысленно далеко (в телефоне, работе).' } },
            { id: 'neighbor_14', text: { ru: 'Нарушение мира в семье или коллективе' }, explanation: { ru: 'Разжигание ссор, провокации, неумение уступать.' } },
            { id: 'neighbor_15', text: { ru: 'Хищение, присвоение чужого (даже малого)' }, severity: 'serious', explanation: { ru: 'Кража, невозврат долгов, использование рабочего в личных целях.' } },
            { id: 'neighbor_16', text: { ru: 'Нерадение о воспитании детей в вере' }, explanation: { ru: 'Забота лишь о телесном развитии ребенка, пренебрежение душой.' } },
            { id: 'neighbor_17', text: { ru: 'Измена (словом, делом или помыслом)' }, severity: 'serious', explanation: { ru: 'Нарушение верности супругу (супруге), флирт на стороне.' } },
            { id: 'neighbor_18', text: { ru: 'Жестокосердие к животным и природе' }, explanation: { ru: 'Издевательство над животными, варварское отношение к экологии.' } },
            { id: 'neighbor_19', text: { ru: 'Лицемерие (желание казаться лучше, чем есть)' }, explanation: { ru: 'Создание образа «идеального» человека при внутренней пустоте.' } },
            { id: 'neighbor_20', text: { ru: 'Невыполнение данных обещаний и долгов' }, explanation: { ru: 'Безответственное отношение к слову, подведение доверившихся.', uk: 'Безвідповідальне ставлення до слова, підведення тих, хто довірився.', en: 'Irresponsible attitude to one\'s word, letting down those who trusted.' } },
            { id: 'neighbor_21', text: { ru: 'Отсутствие милосердия в сети' }, explanation: { ru: 'Агрессивные комментарии в интернете, «троллинг», «хейт».' } },
            { id: 'neighbor_22', text: { ru: 'Информационная нечистоплотность' }, explanation: { ru: 'Распространение сплетен, фейков, непроверенной информации о людях.' } },
            { id: 'neighbor_23', text: { ru: 'Эгоизм в семье' }, explanation: { ru: 'Ожидание, что все должны подстраиваться под мой комфорт.' } },
            { id: 'neighbor_24', text: { ru: 'Пренебрежение к пожилым или больным' }, explanation: { ru: 'Нехватка терпения, раздражение на их немощи.' } },
            { id: 'neighbor_25', text: { ru: 'Горделивое учительство' }, explanation: { ru: 'Желание всех «поучать» и навязывать свою точку зрения, не имея на то любви и права.', uk: 'Бажання всіх «повчати» і нав’язувати свою точку зору, не маючи на те любові та права.', en: 'Desire to "teach" everyone and impose one\'s point of view without having love or the right to do so.' } },
            { id: 'neighbor_26', text: { ru: 'Неблагодарность близким' }, explanation: { ru: 'Забываю сказать «спасибо» за их труд (приготовленный ужин, помощь).' } }
        ]
    },
    {
        id: 'self',
        titleKey: 'cat_self_title',
        subtitleKey: 'cat_self_subtitle',
        title: { ru: 'Против себя' },
        subtitle: { ru: 'III. ЛИЧНОСТЬ' },
        icon: 'person',
        image: '/bg-self.png',
        sins: [
            { id: 'self_1', text: { ru: 'Гордость и тщеславие (любование собой)' }, explanation: { ru: 'Внутреннее любование своими успехами, ожидание похвалы от других.', uk: 'Внутрішнє милування своїми успіхами, очікування похвали від інших.', en: 'Internal admiration of one\'s successes, expecting praise from others.' } },
            { id: 'self_2', text: { ru: 'Уныние, печаль и лень' }, severity: 'serious', explanation: { ru: 'Хроническая апатия, опускание рук при малейших трудностях.' } },
            { id: 'self_3', text: { ru: 'Чревоугодие' }, explanation: { ru: 'Порабощение себя еде, обжорство.' } },
            { id: 'self_3b', text: { ru: 'Пьянство' }, explanation: { ru: 'Порабощение себя алкоголю.' } },
            { id: 'self_3c', text: { ru: 'Курение' }, explanation: { ru: 'Порабощение себя табаку, осквернение тела — храма Духа Святого.' } },
            { id: 'self_4', text: { ru: 'Празднословие (пустые разговоры)' }, explanation: { ru: 'Многочасовые разговоры ни о чем, отсекающие время на полезное.' } },
            { id: 'self_5', text: { ru: 'Нечистые помыслы и блудные мечтания' }, explanation: { ru: 'Удержание в уме блудных фантазий, развратных представлений.' } },
            { id: 'self_6', text: { ru: 'Гнев на самого себя (самоедство)' }, explanation: { ru: 'Бесконечное самоосуждение, не позволяющее поверить в Божье прощение.', uk: 'Нескінченне самоосуд, що не дозволяє повірити в Боже прощення.', en: 'Endless self-condemnation, not allowing to believe in God\'s forgiveness.' } },
            { id: 'self_7', text: { ru: 'Трата времени на пустые развлечения' }, explanation: { ru: 'Пристрастие к сериалам, играм или соцсетям в ущерб душе и семье.', uk: 'Пристрасть до серіалів, ігор або соцмереж на шкоду душі та сім\'ї.', en: 'Addiction to series, games, or social networks to the detriment of soul and family.' } },
            { id: 'self_8', text: { ru: 'Сребролюбие и пристрастие к вещам' }, explanation: { ru: 'Развитие жадности, болезненная привязанность к комфорту.' } },
            { id: 'self_9', text: { ru: 'Ложный стыд (боязнь показаться верующим)' }, explanation: { ru: 'Стеснение своей веры перед светским обществом.', uk: 'Сором своєї віри перед світським суспільством.', en: 'Embarrassment of one\'s faith in front of secular society.' } },
            { id: 'self_10', text: { ru: 'Небрежность к своему здоровью' }, explanation: { ru: 'Разрушение тела (храма духа) перегрузками и недостатком ухода.' } },
            { id: 'self_11', text: { ru: 'Самомнение и надежда только на себя' }, explanation: { ru: 'Твердая убежденность в собственной непогрешимости.', uk: 'Тверда переконаність у власній непогрішності.', en: 'Firm belief in one\'s own infallibility.' } },
            { id: 'self_12', text: { ru: 'Гнилые слова и матерная брань' }, explanation: { ru: 'Употребление матерных и оскорбительных слов.' } },
            { id: 'self_13', text: { ru: 'Осквернение себя непристойными зрелищами' }, severity: 'serious', explanation: { ru: 'Просмотр порнографии, эротики, развращающего контента.' } },
            { id: 'self_14', text: { ru: 'Употребление дурманящих средств' }, severity: 'serious', explanation: { ru: 'Прием наркотиков или изменяющих сознание веществ.' } },
            { id: 'self_15', text: { ru: 'Праздность и нежелание трудиться' }, explanation: { ru: 'Уклонение от работы, желание жить за счет других.' } },
            { id: 'self_16', text: { ru: 'Склонность к азартным играм' }, explanation: { ru: 'Участие в казино, ставках на спорт.' } },
            { id: 'self_17', text: { ru: 'Потеря смысла жизни и мысли о смерти' }, severity: 'serious', explanation: { ru: 'Допущение суицидальных мыслей, отказ от борьбы.' } },
            { id: 'self_18', text: { ru: 'Излишняя забота о внешности' }, explanation: { ru: 'Уход за собой становится культом и главной целью.' } },
            { id: 'self_19', text: { ru: 'Подозрительность и мнительность' }, explanation: { ru: 'Маниакальный поиск во всем скрытых угроз и болезней.' } },
            { id: 'self_20', text: { ru: 'Нерадение о спасении своей души' }, explanation: { ru: 'Погружение в суету без единой мысли о покаянии.' } },
            { id: 'self_21', text: { ru: 'Цифровая зависимость' }, explanation: { ru: '«Зависание» в соцсетях, бесконечное пролистывание ленты, крадущее жизнь и молитву.' } },
            { id: 'self_22', text: { ru: 'Культ потребления' }, explanation: { ru: 'Покупка ненужных вещей ради престижа или «заедания» стресса.' } },
            { id: 'self_23', text: { ru: 'Неверие в свои силы побороть грех', uk: 'Невіра у свої сили подолати гріх', en: 'Disbelief in one\'s power to overcome sin' }, explanation: { ru: '«Я всё равно не исправлюсь, зачем стараться?» (уныние в борьбе с собой).', uk: '«Я все одно не виправлюся, навіщо старатися?» (зневіра в боротьбі з собою).', en: '"I won\'t improve anyway, why try?" (despondency in the struggle with oneself).' } },
            { id: 'self_24', text: { ru: 'Тщеславие добрыми делами' }, explanation: { ru: 'Желание, чтобы другие заметили мою «святость» или мои добрые поступки.' } },
            { id: 'self_25', text: { ru: 'Грехи мысли' }, explanation: { ru: 'Смакование грязных мыслей, фантазии о мести или греховных наслаждениях.' } },
            { id: 'self_26', text: { ru: 'Разбазаривание талантов' }, explanation: { ru: 'Лень развивать свои способности, данные Богом.', uk: 'Лінь розвивати свої здібності, дані Богом.', en: 'Laziness in developing one\'s abilities given by God.' } }
        ]
    }
];

// Child sins (age-appropriate for children 7-12 years old)
const childSins = [
    {
        id: 'god',
        titleKey: 'cat_god_title',
        subtitleKey: 'cat_god_subtitle',
        title: { ru: 'Против Бога' },
        subtitle: { ru: 'I. ОТНОШЕНИЯ' },
        icon: 'church',
        image: '/bg-god.png',
        sins: [
            { id: 'child_god_1', text: { ru: 'Забывал молиться утром и вечером' }, explanation: { ru: 'Поленился встать на молитву, забыл поблагодарить Бога за день.' } },
            { id: 'child_god_2', text: { ru: 'Баловался в храме на службе' }, explanation: { ru: 'Бегал, шептался, смеялся, когда все молились.' } },
            { id: 'child_god_3', text: { ru: 'Стеснялся носить крестик' }, explanation: { ru: 'Снимал крестик, чтобы друзья не смеялись.' } },
            { id: 'child_god_4', text: { ru: 'Произносил имя Бога просто так' }, explanation: { ru: 'Говорил Боже мой в шутку или когда испугался.' } },
            { id: 'child_god_5', text: { ru: 'Не хотел идти в храм' }, explanation: { ru: 'Капризничал, говорил, что устал или скучно.' } },
            { id: 'child_god_6', text: { ru: 'Не благодарил Бога за еду' }, explanation: { ru: 'Забыл сказать спасибо Богу перед обедом.' } },
            { id: 'child_god_7', text: { ru: 'Разговаривал в церкви с друзьями' }, explanation: { ru: 'Шептался, смеялся, мешал другим молиться.' } },
            { id: 'child_god_8', text: { ru: 'Верил в приметы и гороскопы' }, explanation: { ru: 'Боялся черной кошки, верил в счастливые числа.' } },
            { id: 'child_god_9', text: { ru: 'Молился без внимания, торопился' }, explanation: { ru: 'Читал молитву быстро, думая об игре или мультиках.' } },
            { id: 'child_god_10', text: { ru: 'Скрывал от друзей, что ходишь в храм' }, explanation: { ru: 'Боялся, что друзья будут смеяться надо мной.' } },
            { id: 'child_god_11', text: { ru: 'Не читал Евангелие или Библию' }, explanation: { ru: 'Ленился читать святые книги, предпочитал игры.' } },
            { id: 'child_god_12', text: { ru: 'Завидовал, что другие ходят в храм' }, explanation: { ru: 'Сердился, когда братья или сестры молились лучше.' } }
        ]
    },
    {
        id: 'neighbors',
        titleKey: 'cat_neighbors_title',
        subtitleKey: 'cat_neighbors_subtitle',
        title: { ru: 'Против ближнего' },
        subtitle: { ru: 'II. БЛИЖНИЕ' },
        icon: 'people',
        image: '/bg-neighbor.png',
        sins: [
            { id: 'child_neighbor_1', text: { ru: 'Не слушался маму и папу' }, explanation: { ru: 'Игнорировал просьбы, делал по-своему.' } },
            { id: 'child_neighbor_2', text: { ru: 'Грубил родителям и старшим' }, explanation: { ru: 'Отвечал грубо, кричал, хлопал дверью.' } },
            { id: 'child_neighbor_3', text: { ru: 'Обижал младших братьев или сестер' }, explanation: { ru: 'Толкал, отбирал игрушки, дразнил их.' } },
            { id: 'child_neighbor_4', text: { ru: 'Дрался или обзывал других детей' }, explanation: { ru: 'Использовал кулаки или плохие слова.' } },
            { id: 'child_neighbor_5', text: { ru: 'Жадина — не делился игрушками' }, explanation: { ru: 'Не хотел давать свои вещи другим детям.' } },
            { id: 'child_neighbor_6', text: { ru: 'Ябедничал на других детей' }, explanation: { ru: 'Жаловался взрослым, чтобы других наказали.' } },
            { id: 'child_neighbor_7', text: { ru: 'Врал родителям или учителям' }, explanation: { ru: 'Говорил неправду, чтобы избежать наказания.' } },
            { id: 'child_neighbor_8', text: { ru: 'Брал чужое без спроса' }, explanation: { ru: 'Брал игрушки или деньги без разрешения.' } },
            { id: 'child_neighbor_9', text: { ru: 'Дразнился и обзывал других' }, explanation: { ru: 'Придумывал обидные прозвища друзьям.' } },
            { id: 'child_neighbor_10', text: { ru: 'Не уважал учителей в школе' }, explanation: { ru: 'Перебивал, не слушал, грубил учителю.' } },
            { id: 'child_neighbor_11', text: { ru: 'Завидовал вещам других детей' }, explanation: { ru: 'Расстраивался, что у других игрушки лучше.' } },
            { id: 'child_neighbor_12', text: { ru: 'Не помогал дома по хозяйству' }, explanation: { ru: 'Ленился убирать комнату, мыть посуд.' } },
            { id: 'child_neighbor_13', text: { ru: 'Не заступился за слабого' }, explanation: { ru: 'Молчал, когда обижали другого ребенка.' } },
            { id: 'child_neighbor_14', text: { ru: 'Не благодарил за помощь и подарки' }, explanation: { ru: 'Забыл сказать спасибо за подарок.' } }
        ]
    },
    {
        id: 'self',
        titleKey: 'cat_self_title',
        subtitleKey: 'cat_self_subtitle',
        title: { ru: 'Против себя' },
        subtitle: { ru: 'III. Я' },
        icon: 'person',
        image: '/bg-self.png',
        sins: [
            { id: 'child_self_1', text: { ru: 'Капризничал и устраивал истерики' }, explanation: { ru: 'Плакал и кричал, когда не получал желаемого.' } },
            { id: 'child_self_2', text: { ru: 'Ленился делать уроки' }, explanation: { ru: 'Откладывал домашку, играл вместо учебы.' } },
            { id: 'child_self_3', text: { ru: 'Смотрел плохие мультики или видео' }, explanation: { ru: 'Смотрел страшные или вредные видео тайком.' } },
            { id: 'child_self_4', text: { ru: 'Долго играл в телефон тайком' }, explanation: { ru: 'Играл в игры, когда родители запретили.' } },
            { id: 'child_self_5', text: { ru: 'Гордился — думал, что я лучше всех' }, explanation: { ru: 'Хвастался, что я умнее или сильнее других.' } },
            { id: 'child_self_6', text: { ru: 'Говорил плохие ругательные слова' }, explanation: { ru: 'Слышал от других и повторял эти слова.' } },
            { id: 'child_self_7', text: { ru: 'Завидовал оценкам других детей' }, explanation: { ru: 'Сердился, что другим ставят лучшие оценки.' } },
            { id: 'child_self_8', text: { ru: 'Не убирал свои вещи и игрушки' }, explanation: { ru: 'Оставлял игрушки разбросанными по комнате.' } },
            { id: 'child_self_9', text: { ru: 'Тратил деньги на сладости без спроса' }, explanation: { ru: 'Брал деньги у родителей и покупал конфеты.' } },
            { id: 'child_self_10', text: { ru: 'Обманывал, чтобы получить подарок' }, explanation: { ru: 'Говорил неправду, чтобы мне что-то купили.' } },
            { id: 'child_self_11', text: { ru: 'Не хотел ложиться спать вовремя' }, explanation: { ru: 'Капризничал вечером, не хотел спать.' } },
            { id: 'child_self_12', text: { ru: 'Ел слишком много сладкого' }, explanation: { ru: 'Тайком ел конфеты, когда запретили.' } },
            { id: 'child_self_15', text: { ru: 'Курил' }, explanation: { ru: 'Пробовал или курил сигареты, осквернял тело — храм Духа Святого.' } },
            { id: 'child_self_13', text: { ru: 'Не хотел помогать младшим' }, explanation: { ru: 'Отказывался помочь брату или сестре.' } },
            { id: 'child_self_14', text: { ru: 'Сравнивал себя с другими детьми' }, explanation: { ru: 'Расстраивался, что у других одежда лучше.' } }
        ]
    }
];

// Teen sins (same as child for now)
const teenSins = childSins;

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
