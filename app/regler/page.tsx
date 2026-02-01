'use client'

import Navigation from '@/components/Navigation'
import Image from 'next/image'

export default function Regler() {
  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/billed/billed2.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-chrome-gray-900/60 via-chrome-gray-900/50 to-chrome-gray-900/60"></div>
      </div>

      <div className="relative z-10">
        <Navigation />

        <main className="relative pt-32 pb-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-chrome-gray-800/80 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-chrome-gray-700/50 shadow-lg shadow-chrome-gray-900/50">
              <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-chrome-gray-100 via-white to-chrome-gray-200 bg-clip-text text-transparent text-center">Server Regler</h1>
              
              <div className="space-y-8">
                {/* Vores Filosofi */}
                <section className="space-y-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Vores Filosofi</h2>
                  <p className="text-chrome-gray-300 leading-relaxed">
                    Hvad vi forventer af dig som deltager i vores roleplay-univers på Avera
                  </p>
                  <p className="text-chrome-gray-300 leading-relaxed">
                    På Avera er vi overbevist om, at de mest mindeværdige oplevelser skabes, når vores spillere får rum til kreativitet kombineret med respekt for dybt og engagerende rollespil. Vores community er funderet på en fundamental tro på, at hver enkelt spiller ønsker at være med til at forme et dynamisk, fantasifuldt og autentisk RP-univers, hvor loyalitet til din karakter og de historier du deltager i, er i centrum.
                  </p>
                  <p className="text-chrome-gray-300 leading-relaxed">
                    I praksis betyder dette, at vores server opererer efter princippet om selvstændighed med forpligtelse.
                  </p>
                  <p className="text-chrome-gray-300 leading-relaxed">
                    Vores mål er at skabe en platform, hvor kvalitets-rollespil, personlig karaktervækst og narrative forløb føles troværdige og motiverer både dig selv og andre spillere til at tænke innovativt og originalt.
                  </p>
                  <p className="text-chrome-gray-300 leading-relaxed">
                    Når vores server fungerer ud fra princippet om selvstændighed med forpligtelse, indebærer det naturligt, at selvstændighed medfører forpligtelse. Derfor forventer vi følgende af dig som medlem af vores community:
                  </p>
                  <ul className="text-chrome-gray-300 leading-relaxed ml-8 mt-4 space-y-2 list-disc">
                    <li>At du engagerer dig aktivt i serverens rollespil og de situationer du er en del af, uden at træde ud af din rolle.</li>
                    <li>At du handler med intentionen om at forbedre både din egen og andres spiloplevelse.</li>
                    <li>At du anerkender og praktiserer, at fremragende rollespil forudsætter fælles indsats og dedikation fra alle involverede.</li>
                  </ul>
                  <p className="text-chrome-gray-300 leading-relaxed mt-4">
                    På Avera praktiserer vi ikke gruppestraffe, men i stedet personlig ansvarlighed.
                    Vi mener ikke det er rimeligt at sanktionere hele fællesskabet på grund af enkeltpersoners valg. Vores fokus ligger på at adressere dem, der ikke evner at bidrage positivt til rollespillet og de situationer der naturligt opstår.
                  </p>
                  <p className="text-chrome-gray-300 leading-relaxed">
                    Konsekvensen er, at spillere som ikke lever op til serverens værdier og standarder, risikerer at blive fjernet fra communityet.
                  </p>
                  <p className="text-chrome-gray-300 leading-relaxed">
                    Hvis du efter at have læst denne introduktion til Avera føler dig motiveret og har den rigtige tilgang til rollespil, er du velkommen til at ansøge om whitelist her:
                  </p>
                </section>

                {/* Grundlæggende Regler */}
                <section className="space-y-4 border-t border-chrome-gray-700 pt-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Grundlæggende Regler</h2>
                  <p className="text-chrome-gray-300 leading-relaxed">De fundamentale retningslinjer for vores server</p>
                  <ul className="text-chrome-gray-300 leading-relaxed ml-8 mt-4 space-y-2 list-disc">
                    <li>Alderskravet for deltagelse på serveren er minimum 18 år</li>
                    <li>Alle spillere er selv ansvarlige for at være orienteret om gældende regler på Avera.</li>
                    <li>Opførsel der påvirker communityet negativt, kan medføre advarsler eller permanent udelukkelse.</li>
                    <li>Stemmemodifikation er acceptabelt, så længe det fremstår naturligt og ikke kunstigt.</li>
                    <li>Administrationen forbeholder sig retten til at håndhæve regler der ikke er eksplicit nævnt, når det tjener communityets interesser.</li>
                    <li>Administrationen har ret til at bortvise spillere uden varsel.</li>
                    <li>Bugs og fejl skal indrapporteres omgående – bevidst udnyttelse resulterer i permanent udelukkelse.</li>
                    <li>CitizenFX's servicevilkår skal respekteres (handel med in-game genstande for rigtige penge er forbudt).</li>
                    <li>FiveM's servicevilkår skal følges (virkelige firmaers logoer må ikke anvendes).</li>
                    <li>Brug af eksterne programmer eller modifikationer der giver uretfærdig fordel, medfører permanent udelukkelse.</li>
                  </ul>
                </section>

                {/* Rollespil Retningslinjer */}
                <section className="space-y-4 border-t border-chrome-gray-700 pt-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Rollespil Retningslinjer</h2>
                  <p className="text-chrome-gray-300 leading-relaxed">De principper vi forventer du handler efter</p>
                  <ul className="text-chrome-gray-300 leading-relaxed ml-8 mt-4 space-y-3 list-disc">
                    <li><strong className="text-white">Informationsdeling:</strong> Information tilegnet uden for Avera må aldrig anvendes i spillet under nogen omstændigheder.</li>
                    <li><strong className="text-white">Karakterintegritet:</strong> Som spiller skal du forblive i karakter – dette indebærer at du til enhver tid handler som din rolle.</li>
                    <li><strong className="text-white">Fælles tillid:</strong> Vores community er baseret på tillid. Hvis administrationen mister tilliden til dig, kan det føre til konsekvenser eller bortvisning, særligt hvis vi vurderer at du ikke efterlever serverens grundprincipper.</li>
                    <li><strong className="text-white">Fornuftig dømmekraft:</strong> Vi forventer at du som spiller på Avera udviser god dømmekraft i det rollespil du deltager i og i din generelle adfærd på serveren.</li>
                    <li>Vælger du som spiller at lade din karakter dø frem for at fortsætte rollespillet, vil dette resultere i permanent karakter død.
                        Dette gælder specifikt hvis du i en /me besked beskriver noget der klart indikerer at karakteren er afgået ved døden uden mulighed for redning.</li>
                    <li>Skriver du eksempelvis "Hjertet er stoppet" eller tilsvarende, vil karakteren blive permanent dræbt. Dette er en direkte følge af ovenstående regel.</li>
                    <li>Ethvert rollespils scenarie er unikt og kan fortolkes forskelligt. Derfor har vi bevidst undladt at specificere samtlige regler, men lader i stedet rollespillet udvikle sig frit. Oplever du som spiller en handling der ødelægger scenariet, bedes du oprette en henvendelse som administrationen vil behandle.</li>
                    <li>Serveren prioriterer ikke realisme, men fokuserer på hvad der beriger rollespilsoplevelsen. Handler du i en situation på en måde der normalt ville betragtes som regelbrud på andre servere, men som faktisk styrker et scenarie med kvalitets rollespil og underholdning, er det ikke et regelbrud hos os.</li>
                  </ul>
                  <p className="text-chrome-gray-300 leading-relaxed mt-6">
                    <strong className="text-white">Deltager Begrænsninger</strong> - For at fordele aktiviteten på serveren og sikre overskuelige situationer, har vi på Avera indført begrænsninger på kriminelle scenarier. Dette betyder at der er et maksimalt antal deltagere pr. scenarie - gældende for alle parter.
                  </p>
                  <ul className="text-chrome-gray-300 leading-relaxed ml-8 mt-4 space-y-3 list-disc">
                    <li>
                      <strong className="text-white">Standard regel:</strong> Et kriminelt scenarie kan højst omfatte <strong className="text-white">8 deltagere totalt</strong> (inklusiv begge sider)
                      <ul className="ml-6 mt-2 space-y-1 list-disc">
                        <li>Eksempel: Under en koordineret aktion som et overfald, kan hver side maksimalt stille med 8 personer.</li>
                      </ul>
                    </li>
                    <li>
                      <strong className="text-white">Særregel - Bande Konflikter:</strong> Når et scenarie involverer banderelateret aktivitet hvor modparten ligeledes er en bande, udvides grænsen til <strong className="text-white">12 deltagere totalt</strong> (fra begge sider).
                      <ul className="ml-6 mt-2 space-y-1 list-disc">
                        <li>Denne undtagelse er kun relevant ved direkte konfrontationer mellem organiserede grupper.</li>
                      </ul>
                    </li>
                    <li>
                      <strong className="text-white">Særregel - Ordensmagten:</strong> Politistyrken er en omfattende organisation, som i adskillige situationer skal have <strong className="text-white">kapacitet til</strong> at repræsentere en overlegen kraft. Derfor er politiet ikke underlagt specifikke begrænsninger på antal enheder. Dog forventes det at politiet håndterer hver enkelt situation med hensyn til de øvrige begrænsninger - Dette indebærer at ordensmagten principielt skal forsøge at møde situationer med passende ressourcer, hverken mere eller mindre. Politiet skal således være bevidste om ressourceforbrug og tilpasse sig efter situationen.
                    </li>
                  </ul>
                </section>

                {/* Organiserede Grupper */}
                <section className="space-y-4 border-t border-chrome-gray-700 pt-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Organiserede Grupper og Retningslinjer</h2>
                  <p className="text-chrome-gray-300 leading-relaxed">Vores regler og forventninger til organiserede grupper på Avera</p>
                  <p className="text-chrome-gray-300 leading-relaxed">
                    Organiserede grupper på Avera har hovedansvaret for deres egen rollespilsudvikling. En gruppes etablering, progression og funktion styres af gruppen selv, og foregår i videst muligt omfang uafhængigt af serverens administration. Dette giver frihed til at grundlægge en gruppe og realisere sine idéer uden forudgående godkendelsesproces. Denne frihed medfører naturligvis øget ansvar, primært i form af aktivt at understøtte serverens værdier, forventninger og regelsæt.
                  </p>
                  <ul className="text-chrome-gray-300 leading-relaxed ml-8 mt-4 space-y-2 list-disc">
                    <li>Organiserede grupper på Avera har ingen fast grænse for medlemsantal. Dette sikrer maksimal frihed og mulighed for at strukturere gruppen i forskellige afdelinger. Grupper er selvfølgelig stadig underlagt serverens øvrige begrænsninger for scenarier.</li>
                    <li>Det sker jævnligt at enkelte gruppemedlemmer begår fejl med vidtrækkende konsekvenser for hele kollektivet. På Avera ønsker vi ikke at straffe en hel gruppe for én persons handlinger - Derfor vil ansvarlige sanktionere enkeltpersoner, ikke grupper. Dette gælder dog ikke hvis gruppen samlet set vurderes ikke at bidrage positivt til serverens rollespil, hvilket kan medføre opløsning af gruppen.</li>
                  </ul>
                </section>

                {/* Content Creators */}
                <section className="space-y-4 border-t border-chrome-gray-700 pt-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Retningslinjer for Content Creators</h2>
                  <p className="text-chrome-gray-300 leading-relaxed">De forventninger vi har til dig som skaber indhold på Avera</p>
                  <p className="text-chrome-gray-300 leading-relaxed">
                    <strong className="text-white">Respekt i adfærd og kommunikation</strong>
                  </p>
                  <p className="text-chrome-gray-300 leading-relaxed">
                    Vi forventer at alle der livestreamer eller publicerer materiale fra Avera, udviser respekt over for spillere, administration og hele communityet.
                  </p>
                  <p className="text-chrome-gray-300 leading-relaxed">
                    Du er naturligvis velkommen til at dele dine synspunkter, inklusiv uenighed eller kritiske bemærkninger, men det skal ske på en opbyggende og respektfuld måde.
                  </p>
                  <p className="text-chrome-gray-300 leading-relaxed">
                    Personangreb, nedværdigende udtalelser eller generel negativ omtale af medspillere og communityet tolereres ikke. Vores mål er at skabe et miljø hvor kritik kan fremsættes uden at fornærme andre, og hvor Avera fremstilles på en retfærdig og ordentlig måde.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
