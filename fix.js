const fs = require('fs');
const path = require('path');

const filepath = path.join('d:', 'Ispoved', 'src', 'data', 'prayers.js');
let content = fs.readFileSync(filepath, 'utf-8');

const replacement = `        beforeCommunion: \`
            <div class="space-y-8">
                <h2 class="text-2xl font-bold mb-6 text-center text-[#c23b22] uppercase">Последование ко Святому Причащению</h2>
                
                <div class="p-6 bg-[#c23b22]/5 rounded-2xl border border-[#c23b22]/10 italic text-[#c23b22]">
                    <p class="mb-4">Моли́твами святы́х оте́ц на́ших, Го́споди Иису́се Христе́ Бо́же на́ш, поми́луй на́с. Ами́нь.</p>
                    <p class="mb-4">Царю́ Небе́сный, Уте́шителю, Ду́ше и́стины, И́же везде́ сы́й и вся́ исполня́яй, Сокро́вище благи́х и жи́зни Пода́телю, прииди́ и всели́ся в ны́, и очи́сти ны́ от вся́кия скве́рны, и спаси́, Бла́же, ду́ши на́ша.</p>
                    <p class="mb-2">Святы́й Бо́же, Святы́й Кре́пкий, Святы́й Безсме́ртный, поми́луй на́с. (Трижды)</p>
                    <p class="mb-4">Сла́ва Отцу, и Сы́ну, и Свято́му Ду́ху, и ны́не и при́сно и во ве́ки веко́в. Ами́нь.</p>
                    <p class="mb-4">Пресвята́я Тро́ице, поми́луй на́с; Го́споди, очи́сти грехи́ на́ша; Влады́ко, прости́ беззако́ния на́ша; Святы́й, посети́ и исцели́ не́мощи на́ша, и́мене Твоего́ ра́ди.</p>
                    <p class="mb-4">Го́споди, поми́луй. (Трижды)</p>
                    <p class="mb-4">Сла́ва, и ны́не:</p>
                    <p class="mb-4">О́тче на́ш, И́же еси́ на небесе́х! Да святи́тся и́мя Твое́, да прии́дет Ца́рствие Твое́, да бу́дет во́ля Твоя́, я́ко на небеси́ и на земли́. Хле́б на́ш насу́щный да́ждь на́м дне́сь; и оста́ви на́м до́лги на́ша, я́коже и мы́ оставля́ем должнико́м на́шим; и не введи́ на́с во искуше́ние, но изба́ви на́с от лука́ваго.</p>
                </div>

                <div class="space-y-6">
                    <h3 class="font-bold text-xl text-[#c23b22] text-center uppercase">Псалом 22</h3>
                    <p class="leading-relaxed text-lg italic"><span class="text-[#c23b22] text-2xl font-bold">Г</span>оспо́дь пасе́т мя, и ничто́же мя лиши́т. На ме́сте зла́чне, та́мо всели́ мя, на воде́ поко́йне воспита́ мя. Ду́шу мою́ обрати́, наста́ви мя на стези́ пра́вды, и́мене Твоего́ ра́ди. А́ще бо и пойду́ посреде́ се́ни сме́ртныя, не убою́ся зла, я́ко Ты со мно́ю еси́, же́зл Твой и па́лица Твоя́, та мя уте́шиста. Угото́вал еси́ предо мно́ю трапе́зу сопроти́в стужа́ющим мне, ума́стил еси́ еле́ом главу́ мою́, и ча́ша Твоя́ упоева́ющи мя, я́ко держа́вна. И ми́лость Твоя́ пожене́т мя вся дни живота́ моего́, и е́же всели́ти ми ся в дом Госпо́день в долготу́ дний.</p>
                </div>

                <div class="space-y-6">
                    <h3 class="font-bold text-xl text-[#c23b22] text-center uppercase">Псалом 23</h3>
                    <p class="leading-relaxed text-lg italic"><span class="text-[#c23b22] text-2xl font-bold">Г</span>оспо́дня земля́, и исполне́ние ея́, вселе́нная и вси живу́щии на ней. Той на моря́х основа́л ю́ есть, и на река́х угото́вал ю́ есть. Кто взы́дет на го́ру Госпо́дню? Или́ кто ста́нет на ме́сте святе́м Его́? Непови́нен рука́ма и чист се́рдцем, и́же не прия́т всу́е ду́шу свою́, и не кля́тся ле́стию и́скреннему своему́. Сей прии́мет благослове́ние от Го́спода, и ми́лостыню от Бо́га, Спа́са своего́. Сей род и́щущих Го́спода, и́щущих лице́ Бо́га Иа́ковля. Возми́те врата́ кня́зи ва́ша, и возми́теся врата́ ве́чная, и вни́дет Царь сла́вы. Кто есть сей Царь сла́вы? Госпо́дь кре́пок и си́лен, Госпо́дь си́лен в бра́ни. Возми́те врата́ кня́зи ва́ша, и возми́теся врата́ ве́чная, и вни́дет Царь сла́вы. Кто есть сей Царь сла́вы? Госпо́дь сил, Той есть Царь сла́вы.</p>
                </div>

                <div class="space-y-6">
                    <h3 class="font-bold text-xl text-[#c23b22] text-center uppercase">Псалом 115</h3>
                    <p class="leading-relaxed text-lg italic"><span class="text-[#c23b22] text-2xl font-bold">В</span>е́ровах, те́мже возглаго́лах, аз же смири́хся зело́. Аз же рех во изступле́нии мое́м: всяк челове́к ложь. Что возда́м Го́сподеви о всех, я́же воздаде́ ми? Ча́шу спасе́ния прииму́, и и́мя Госпо́дне призову́. Моли́твы моя́ Го́сподеви возда́м пред все́ми людьми́ Его́. Честна́ пред Го́сподем смерть преподо́бных Его́. О, Го́споди, аз раб Твой, аз раб Твой и сын рабы́ Твоея́; растерза́л еси́ у́зы моя́. Тебе́ пожру́ же́ртву хвале́ния, и во и́мя Госпо́дне призову́. Моли́твы моя́ Го́сподеви возда́м пред все́ми людьми́ Его́, во дво́рех до́му Госпо́дня, посреде́ тебе́, Иерусали́ме.</p>
                </div>

                <div class="p-6 bg-[#c23b22]/5 rounded-2xl border border-[#c23b22]/10 italic text-center">
                    <p class="mb-4 text-[#c23b22]">Сла́ва, и ны́не:</p>
                    <p class="mb-4 text-[#c23b22]">Аллилу́иа, аллилу́иа, аллилу́иа, сла́ва Тебе́, Бо́же. (Трижды)</p>
                    <p class="mb-4 text-[#c23b22]">Го́споди, поми́луй. (Трижды)</p>
                </div>

                <div class="space-y-12">
                     <div class="p-6 bg-[#c23b22]/5 rounded-2xl border border-[#c23b22]/10">
                        <h4 class="font-bold text-lg mb-4 text-[#c23b22] italic">Моли́тва 1-я, свята́го Васи́лия Вели́каго</h4>
                        <p class="leading-relaxed"><span class="text-[#c23b22] text-2xl font-bold">В</span>лады́ко Го́споди Иису́се Христе́, Бо́же наш, Исто́чниче жи́зни и безсме́ртия, всея́ тва́ри ви́димыя и неви́димыя Соде́телю, Безнача́льнаго Отца́ соприсносу́щный Сы́не и собезнача́льный, Премно́гия ра́ди бла́гости в после́дния дни в плоть оболки́йся, и распя́тый, и погребе́нный за ны неблагода́рныя и злонра́вныя, и Твое́ю Кро́вию обнови́вый растле́вшее грехо́м естество́ на́ше! Са́м, Безсме́ртный Царю́, приими́ и мое́ гре́шнаго покая́ние... И да не в суд ми бу́дет причаще́ние пречи́стых и животворя́щих Та́ин Твои́х... в ни́хже препросла́влен еси́ во ве́ки. Ами́нь.</p>
                    </div>

                    <div class="p-6 bg-[#c23b22]/5 rounded-2xl border border-[#c23b22]/10">
                        <h4 class="font-bold text-lg mb-4 text-[#c23b22] italic">Моли́тва 2-я, свята́го Иоа́нна Златоу́ста</h4>
                        <p class="leading-relaxed"><span class="text-[#c23b22] text-2xl font-bold">Г</span>о́споди Бо́же мой, ве́м, я́ко несмь досто́ин, ниже́ дово́лен, да под кро́в вни́деши хра́ма души́ моея́... Ами́нь.</p>
                    </div>

                    <div class="p-6 bg-[#c23b22]/5 rounded-2xl border border-[#c23b22]/10">
                         <h4 class="font-bold text-lg mb-4 text-[#c23b22] italic">Моли́тва ко Пресвято́й Богоро́дице</h4>
                        <p class="leading-relaxed"><span class="text-[#c23b22] text-2xl font-bold">П</span>ресвята́я Влады́чице Богоро́дице, све́те помраче́нныя моея́ души́, наде́ждо, покро́ве, прибе́жище, утеше́ние, ра́дование мое́!... Ами́нь.</p>
                    </div>

                    <div class="p-6 bg-[#c23b22]/5 rounded-2xl border border-[#c23b22]/10 italic text-center">
                        <p class="mb-4"><span class="text-[#c23b22] text-2xl font-bold">Н</span>ы́не отпуща́еши раба́ Твоего́, Влады́ко, по глаго́лу Твоему́, с ми́ром; я́ко ви́деста о́чи мои́ спасе́ние Твое́, е́же еси́ угото́вал пред лице́м все́х люде́й, све́т во открове́ние язы́ков, и сла́ву люде́й Твои́х Изра́иля.</p>
                    </div>
                </div>
            </div>
        \`,
        afterCommunion: \`
            <div class="space-y-8">
                <h2 class="text-2xl font-bold mb-6 text-center text-[#c23b22] uppercase">Благодарственные молитвы по Святом Причащении</h2>
                
                <div class="p-6 bg-[#c23b22]/5 rounded-2xl border border-[#c23b22]/10 italic text-center text-[#c23b22]">
                    <p class="mb-4">Сла́ва Тебе́, Боже. Сла́ва Тебе́, Боже. Сла́ва Тебе́, Боже.</p>
                </div>

                <div class="space-y-12">
                     <div class="p-6 bg-[#c23b22]/5 rounded-2xl border border-[#c23b22]/10">
                        <h4 class="font-bold text-lg mb-4 text-[#c23b22] italic">Моли́тва 1-я</h4>
                        <p class="leading-relaxed"><span class="text-[#c23b22] text-2xl font-bold">Б</span>лагодарю́ Тя, Го́споди Бо́же мой, я́ко не отри́нул еси́ мя гре́шнаго, но о́бщника мя бы́ти святы́нь Твои́х сподо́бил еси́... Ами́нь.</p>
                    </div>

                    <div class="p-6 bg-[#c23b22]/5 rounded-2xl border border-[#c23b22]/10">
                        <h4 class="font-bold text-lg mb-4 text-[#c23b22] italic">Моли́тва 2-я, свята́го Васи́лия Вели́каго</h4>
                        <p class="leading-relaxed"><span class="text-[#c23b22] text-2xl font-bold">В</span>лады́ко Христе́ Бо́же, Царю́ веко́в и Соде́телю всех, благодарю́ Тя о всех, я́же ми еси́ по́дал благи́х... Ами́нь.</p>
                    </div>

                    <div class="p-6 bg-[#c23b22]/5 rounded-2xl border border-[#c23b22]/10">
                        <h4 class="font-bold text-lg mb-4 text-[#c23b22] italic">Моли́тва 3-я, Симео́на Метафра́ста</h4>
                        <p class="leading-relaxed"><span class="text-[#c23b22] text-2xl font-bold">Д</span>авы́й пи́щу мне плоть Твою́ во́лею, огнь сый и опаля́яй недосто́йныя... Ами́нь.</p>
                    </div>

                    <div class="p-6 bg-[#c23b22]/5 rounded-2xl border border-[#c23b22]/10">
                        <h4 class="font-bold text-lg mb-4 text-[#c23b22] italic">Моли́тва 4-я</h4>
                        <p class="leading-relaxed"><span class="text-[#c23b22] text-2xl font-bold">Т</span>е́ло Твое́ Свято́е, Го́споди Иису́се Христе́ Бо́же наш, да бу́дет ми в живо́т ве́чный... Ами́нь.</p>
                    </div>

                    <div class="p-6 bg-[#c23b22]/5 rounded-2xl border border-[#c23b22]/10">
                        <h4 class="font-bold text-lg mb-4 text-[#c23b22] italic">Моли́тва 5-я, ко Пресвято́й Богоро́дице</h4>
                        <p class="leading-relaxed"><span class="text-[#c23b22] text-2xl font-bold">П</span>ресвята́я Влады́чице Богоро́дице... Ами́нь.</p>
                    </div>
                </div>

                <div class="p-6 bg-[#c23b22]/5 rounded-2xl border border-[#c23b22]/10 italic text-center">
                    <p class="mb-4"><span class="text-[#c23b22] text-2xl font-bold">Н</span>ы́не отпуща́еши раба́ Твоего́, Влады́ко, по глаго́лу Твоему́, с ми́ром; я́ко ви́деста о́чи мои́ спасе́ние Твое́, е́же еси́ угото́вал пред лице́м всех люде́й, свет во открове́ние язы́ков, и сла́ву люде́й Твои́х Изра́иля.</p>
                </div>
            </div>
        \``;

const startIdx = content.indexOf('beforeCommunion: `');
const nextSectionIdx = content.indexOf('uk: {');
const extractedSection = content.substring(startIdx, nextSectionIdx);

const endStr = '</div>\\n            </div>\\n        `';
const endIdx = extractedSection.indexOf(endStr, extractedSection.indexOf('afterCommunion: `')) + endStr.length;

if (endIdx > endStr.length) {
    const toReplace = extractedSection.substring(0, endIdx);
    const newContent = content.substring(0, startIdx) + replacement + content.substring(startIdx + endIdx);
    fs.writeFileSync(filepath, newContent, 'utf-8');
    console.log("Successfully replaced beforeCommunion and afterCommunion");
} else {
    console.log("Could not find the target section bounds.");
}
