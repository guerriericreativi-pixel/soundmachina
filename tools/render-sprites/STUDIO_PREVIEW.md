# Preview del PANEL in studio

Scene procedurali Blender Cycles, con hardware e ambiente nello stesso spazio 3D.
Il modello principale scelto è il **Virus TI2 Desktop senza tastiera**.
Il **Virus TI Snow** resta un modello separato, bianco e con sei manopole.

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b \
  -P tools/render-sprites/virus_ti2_studio_preview.py
```

Per il TI Snow usare `virus_studio_preview.py`. Aggiungere `--preview` per una
bozza più veloce. Il render finale usa 128 campioni, denoising e gestione colore AgX.

File in `output/blender/`:

- `virus-ti2-desktop-dettaglio.png`: vista ravvicinata del TI2 Desktop.
- `virus-ti2-desktop-studio.png`: TI2 Desktop ambientato in studio.
- `virus-ti2-desktop-studio.blend`: scena modificabile con entrambe le camere.
- `panel-materiali-preview-virus-ti-snow.png`: Snow con la camera originale del PANEL.
- `panel-studio-preview-virus-ti-snow.png` e `.blend`: Snow ambientato in studio.

Le immagini precedenti `panel-*-preview-dark.*` sono bozze superate: rappresentano
uno Snow reinterpretato e **non** il TI2 Desktop o il Darkstar originale.

## Vista per il PANEL

`virus_ti2_panel_focus.py` ricarica la scena del Desktop e genera
`virus-ti2-desktop-panel-focus.png` e `.blend`: hardware al 92% della larghezza,
zoom del 35% rispetto alla vista di studio, camera a 18° e nessuna attrezzatura
di studio visibile. Restano scrivania, materiali e luci. L'output è 1920×960.

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b \
  -P tools/render-sprites/virus_ti2_panel_focus.py
```

Con `-- --snow` lo stesso generatore produce `virus-ti-snow-panel-focus.png`
e `.blend`, mantenendo la geometria bianca dello Snow. Inquadratura a 18°,
hardware al 91% della larghezza, 1920×1080 e sola scrivania come ambiente.

### Snow: scocca e tasti rifiniti

`virus_snow_studio_refine.py` carica la scena Snow ravvicinata e genera
`virus-ti-snow-studio-refined.png` e `.blend`. Il fronte della scocca è leggermente
rastremato (stima fotografica, 94% della larghezza posteriore), con raccordo del bordo.
I 21 tasti hanno angoli più morbidi e una bombatura lieve; posizioni e ingombri
restano quelli del modello. La luce ambiente e il fill sono ridotti, con key laterale
calda e strip posteriore fredda. Questo è il render Snow più recente.

La ricostruzione del TI2 è tracciata sulla fotografia frontale fornita dall'utente.
Sono ricostruzioni procedurali: forme e serigrafie non provengono da un CAD Access.
Il bordo anteriore in legno e la scocca a cuneo si riferiscono al TI2 Desktop scelto;
il modello Darkstar con tastiera non è stato usato.

La scritta sul display è dimostrativa. La preview non legge il Virus e non
cambia preset, MIDI, `layout.json` o gli asset dell'applicazione.

Per integrare i materiali nel PANEL interattivo occorre esportare separatamente
scocca, sfondo e sprite dei controlli con la camera originale e la stessa luce.
La vista ambientata serve a valutare la direzione visiva; non è uno sprite interattivo.

## Pannelli interattivi integrati

`assets/panel/` contiene gli sfondi statici e gli sprite separati dei due strumenti.
Snow: 64 fotogrammi per manopola, 2 stati dei tasti, scocca e serigrafia statiche.
TI2 Desktop: 32 manopole, 43 tasti, 53 LED; stessa tecnica di rendering.
Le posizioni proiettate sono nei rispettivi `*-layout.json` e nel file runtime
`virus-panel-layouts.js`. Il codice interattivo è `virus-hardware-panel.js`;
le due immagini condividono suono, parte e trasporto MIDI, senza condividere il layout.

Le tre manopole superiori degli effetti regolano il blocco selezionato. Per Low/High
EQ il terzo controllo ripete il gain (l'hardware ha solo due parametri di EQ).
Character non espone un parametro Intensity nel protocollo TI: il secondo controllo
regola il volume patch come compensazione e il display lo indica esplicitamente.
STORE apre il salvataggio nella libreria PATCH dell'app. Non scrive uno slot RAM hardware.
Il controllo dei parametri usa le pagine TI A, B, E, F e D, con limiti verificati sulle
[definizioni TI di gearmulator](https://github.com/dsp56300/gearmulator/blob/main/source/axel/osTIrusJucePlugin/parameterDescriptions_TI.json).

Confronti e verifica finale: `design-qa.md`, immagini in `output/qa/`.

## Snow: materiali e geometria dal riferimento fotografico

La scocca è in acciaio verniciato a polvere, con micro-porosità fine. I fondi
grafici delle due sezioni sono più scuri dei controlli. I tasti ABS sono bassi
e piani, con un raccordo minimo agli angoli (3,2% della larghezza). Le sei
manopole hanno corpo più alto a cono tronco, 14 leggere righe laterali,
plastica grigia uniforme e indice chiaro in rilievo, senza scanalatura superiore.
Il piano è legno grigio medio, illuminato da softbox con ombre di contatto.

Rigenerazione con Blender, dalla radice del progetto:

```sh
Blender -b -P tools/render-sprites/virus_snow_studio_refine.py
Blender -b -P tools/render-sprites/virus_snow_plate.py
Blender -b -P tools/render-sprites/virus_snow_key_atlas.py
Blender -b -P tools/render-sprites/virus_snow_knob_atlas.py
Blender -b -P tools/render-sprites/virus_snow_lcd.py
```

Il display usa un substrato LCD raster e una copertura trasparente renderizzata
separatamente; il testo vivo resta leggibile sopra il substrato. PNG e scene
Blender rimangono in `output/blender/`, WebP di produzione in `assets/panel/`.
La geometria è ricostruita dalle fotografie, senza quote CAD certificate.

Le manopole Snow aggiornate hanno altezza 1,09, profondità delle 14 righe
0,055 e indice bianco 0,125×0,84×0,07. Per il WebP di produzione eseguire
`pack_snow_knobs.py` con Python/Pillow dopo l’export Blender: il confezionamento
rimuove il velo residuo del catcher e verifica tutti i bordi alfa.

Per il piano continuo: renderizzare `virus_studio_desk.py` e convertire il PNG
in `studio-grey-wood.webp`. `virus_snow_plate.py` ora esporta la scocca su
trasparenza; confezionare il PNG con `pack_snow_plate.py` (Python/Pillow).
Il background della pagina mostra il legno da una camera ortografica verticale.

Ultima rifinitura Snow: i tasti bassi hanno una curvatura lieve della faccia
(corona 0,04) che produce la sfumatura superiore/inferiore nel render.
Usare `pack_snow_keys.py` (Python/Pillow) dopo l’export dei due stati.
Fondi delle sezioni #818682, leggermente più chiari ma distinti dai controlli.

La scocca Snow è una fascia con due pieghe laterali a 90° (sinistra/destra).
Spessore 0,055 e raggio di piegatura 0,22: il raccordo deriva dalla piega
della lamiera, senza parete frontale aggiunta o angoli da guscio stampato.

Ultimo raccordo: raggio delle pieghe laterali 0,55 per una curvatura più
morbida; manopole in ABS uniforme #a6a9a5, leggermente più scuro.

## Approvazione del rendering

Su richiesta dell’utente, mostrare e far approvare il rendering locale
prima di qualsiasi nuovo commit o push delle modifiche grafiche.
L’approvazione di un singolo dettaglio non approva automaticamente il pannello
completo né autorizza la pubblicazione di altre correzioni ancora in revisione.

Anteprima attuale: conservata la piega laterale con raggio 0,55; bordo
libero della lamiera raccordato 0,022 e rimbalzo inferiore limitato a piano
e scocca per eliminare l’ombra nera piena sotto il frontale. I controlli
mobili mantengono la loro illuminazione approvata.

Il vano frontale è chiuso da un pannello di ciliegio satinato, incassato
all’interno della fascia metallica. Venatura orizzontale, spigoli raccordati,
materiale caldo distinto dal legno grigio del piano di studio. La luce
inferiore è ridotta a 2400 e limitata a lamiera, piano e inserto in ciliegio.
Questa variante è locale e richiede l’ok del rendering prima di commit/push.

Ultima anteprima richiesta: scocca inclinata con altezza 4 cm davanti e
4,5 cm dietro (quote indicate dall’utente), esclusi i controlli. Piano e camera
trasformati insieme per conservare gli ancoraggi interattivi. Frontale in
ciliegio largo 31,3 unità, alto 3,89, incassato 0,05; colori meno saturi
#6c574a/#9d826f e angoli superiori adattati alle pieghe della lamiera.
Linea di contorno con bevel_depth 0,028, rispetto al precedente 0,02.
Richiede ancora approvazione del rendering prima di commit e push.

Approvata la variante Snow con richiesta esplicita di commit/push. Ultimo
render 1920×1200: ombra fisica interamente nel canvas, PMMA trasparente
smussato, ciliegio opaco con venatura irregolare. I metadati Snow incorporati
usano aspect 1,6; rigenerarli dal JSON dopo l’export.
