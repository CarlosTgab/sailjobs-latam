// Datos reales extraídos de Ranking 2026 (2).xlsx
// Fuente: archivo Excel subido por el usuario.
// Criterio de orden: posición del ranking / puntaje neto.

const rankingText = `
ilca-4-1|ILCA 4|1|Muscolini|Gino|RRC|Senior /Masculino|20|36|5
ilca-4-2|ILCA 4|2|Meynet|Mia|YCR|Senior /Femenino|29|46|5
ilca-4-3|ILCA 4|3|Properzi|Juan Sebastian|RRC|U18 /Masculino|30|80|5
ilca-4-4|ILCA 4|4|Serrano|Felipe|RRC|U18 /Masculino|35|54|5
ilca-4-5|ILCA 4|5|Lopez Fracchia|Tomás|RRC|U18 /Masculino|35|85|5
ilca-4-6|ILCA 4|6|Fernandez Alonso|Simon|CNSI|U18 /Masculino|41|80|5
ilca-4-7|ILCA 4|7|Tejada ibañez|Maximo|SYN|U18 /Masculino|41|91|5
ilca-4-8|ILCA 4|8|Moreno Panzino|Manuel|CNSI|U18 /Masculino|47|97|5
ilca-4-9|ILCA 4|9|Videla Tejo|Yago|SYN|Senior /Masculino|54|73|5
ilca-4-10|ILCA 4|10|Saraví|Santiago|CRLP|U18 /Masculino|54|104|5
ilca-4-11|ILCA 4|11|Wenzel|Valentino|CRLP|U18 /Masculino|57|107|5
ilca-4-12|ILCA 4|12|Boz|Octavio|YCR|U18 /Masculino|59|98|5
ilca-4-13|ILCA 4|13|Musumeci|Enzo|RRC|U18 /Masculino|59|109|5
ilca-4-14|ILCA 4|14|Viera|Lucas|YCC|U18 /Masculino|60|99|5
ilca-4-15|ILCA 4|15|Pinedo Chiappa|Lautaro|CRLP|U18 /Masculino|64|114|5
ilca-4-16|ILCA 4|16|Domine Zeano|Angela Vittoria|YCR|U18 /Femenino|66|105|5
ilca-4-17|ILCA 4|17|Mones Ruiz|Félix|CNO|U18 /Masculino|66|116|5
ilca-4-18|ILCA 4|18|Gutiérrez|Lautaro Martin|YCC|Senior /Masculino|69|108|5
ilca-4-19|ILCA 4|19|Molinari|Josefina|CVB|U18 /Femenino|70|120|5
ilca-4-20|ILCA 4|20|Badorrey|Mateo|CRLP|U18 /Masculino|72|122|5
ilca-4-21|ILCA 4|21|Favero|Justino|CRLP|U18 /Masculino|73|123|5
ilca-4-22|ILCA 4|22|Longo|Sofía|YCR|U18 /Femenino|73|123|5
ilca-4-23|ILCA 4|23|Lueg|Thiago|CNSI|U18 /Masculino|74|124|5
ilca-4-24|ILCA 4|24|Luque|Bautista|YCO|U18 /Masculino|74|124|5
ilca-4-25|ILCA 4|25|Crola|Juana|CRLP|Senior /Femenino|75|125|5
ilca-4-26|ILCA 4|26|Ronchi De Croce|Santino Alejandro|CNO|U18 /Masculino|76|126|5
ilca-4-27|ILCA 4|27|Lenzetti Colin|Grecia|CRLP|Senior /Femenino|80|130|5
ilca-4-28|ILCA 4|28|Donato|Luca|CRLP|U18 /Masculino|81|131|5
ilca-4-29|ILCA 4|29|Corredera|Martina|RRC|Senior /Femenino|82|121|5
ilca-4-30|ILCA 4|30|Galli Kluge|Valentina|CVB|U18 /Femenino|83|133|5
ilca-4-31|ILCA 4|31|Martin|Daphne|YCB|U18 /Femenino|86|136|5
ilca-4-32|ILCA 4|32|Pereyra Iraola|Felix Delfin|YCA|Senior /Masculino|89|139|5
ilca-4-33|ILCA 4|33|Colla Altisen|Lara|RRC|U18 /Femenino|90|129|5
ilca-4-34|ILCA 4|34|Katz|Simon|YCR|U18 /Masculino|90|140|5
ilca-4-35|ILCA 4|35|Prat|Joaquin|CAVLA|U18 /Masculino|90|140|5
ilca-4-36|ILCA 4|36|Garcia Canteli|Damasia|CNSI|U18 /Femenino|91|141|5
ilca-4-37|ILCA 4|37|Lambezat|Dominique|YCB|U18 /Femenino|91|141|5
ilca-4-38|ILCA 4|38|Rojas Silveyra|Carmen|YCB|U18 /Femenino|92|142|5
ilca-4-39|ILCA 4|39|Fernández|Iván|RRC|U18 /Masculino|93|143|5
ilca-4-40|ILCA 4|40|Febre Prieto|Federico|CNSI|U18 /Masculino|94|138|5
ilca-4-41|ILCA 4|41|Llopart|Victoria|CMR|U18 /Femenino|94|140|5
ilca-4-42|ILCA 4|42|Stupenengo|Rafi|CUBA|U18 /Femenino|95|145|5
ilca-4-43|ILCA 4|43|Palacio Canto|Agustin|CUBA|U18 /Masculino|96|146|5
ilca-4-44|ILCA 4|44|Lorenzini|Francisco|CUBA|U18 /Masculino|97|147|5
ilca-4-45|ILCA 4|45|D'Onofrio Lorenzo|Sofía Belen|YCA|U18 /Femenino|98|148|5
ilca-4-46|ILCA 4|46|Capitanich|Amanda|CRC|U18 /Femenino|99|138|5
ilca-4-47|ILCA 4|47|Prat|Juan Martin|CRSN|U18 /Masculino|99|149|5
ilca-4-48|ILCA 4|48|Romero|Lucia|CUBA|U18 /Femenino|99|149|5
ilca-4-49|ILCA 4|49|del carril|camila|CNSI|Senior /Femenino|100|150|5
ilca-4-50|ILCA 4|50|García|Ariel Martín|CVSI|U18 /Masculino|100|150|5
ilca-4-51|ILCA 4|51|Schandeler|Matias|YCA|U18 /Masculino|101|151|5
ilca-4-52|ILCA 4|52|Micelotta|Emilia|CRLP|U18 /Femenino|102|152|5
ilca-4-53|ILCA 4|53|Pinosa Percossi|Nicolas|CNO|U16 /Masculino|102|152|5
ilca-6-1|ILCA 6|1|Kuttel|Delfina|CNSP|U21 / Femenino|17|27|5
ilca-6-2|ILCA 6|2|Vogt|Lucas|YCR|U19 / Masculino|19|43|5
ilca-6-3|ILCA 6|3|busch|isabel|CNSI|Senior / Femenino|25|49|5
ilca-6-4|ILCA 6|4|Maio|Luca|YCR|U19 / Masculino|35|59|5
ilca-6-5|ILCA 6|5|Benedetto|Julieta|CVB|U19 & U21 / Femenino|39|63|5
ilca-6-6|ILCA 6|6|Domine Zeano|Angela Vittoria|YCR|U19 & U21 / Femenino|53|155|5
ilca-6-7|ILCA 6|7|Villar|Andrés|CNO|Senior / Masculino|62|90|5
ilca-6-8|ILCA 6|8|Pinto|Naina Marie|CNO|U21 / Femenino|63|117|5
ilca-6-9|ILCA 6|9|Falasca|Lucía|YCA|Aprendiz de Master / Femenino|70|121|5
ilca-6-10|ILCA 6|10|Pinto|Maggie|CNO|U19 & U21 / Femenino|71|109|5
ilca-6-11|ILCA 6|11|Cardozo|Luciana|YCO|Senior / Femenino|71|122|5
ilca-6-12|ILCA 6|12|González Villalba|Felipe|CVB|U17 / Masculino|73|103|5
ilca-6-13|ILCA 6|13|Tejada Ibañez|Manuel|SYN|Senior / Masculino|78|180|5
ilca-6-14|ILCA 6|14|Massa Galli|Felipe|CVB|U19 / Masculino|79|139|5
ilca-6-15|ILCA 6|15|Viale Ponzo|Santiago Andres|CVB|U17 / Masculino|91|193|5
ilca-6-16|ILCA 6|16|Galvan|Joaquin|YCO|Senior / Masculino|96|147|5
ilca-6-17|ILCA 6|17|Molinari|Josefina|CVB|U17 / Femenino|97|199|5
ilca-6-18|ILCA 6|18|Arocena|Felipe|CNSI|U19 / Masculino|98|144|5
ilca-6-19|ILCA 6|19|Dalli|Delfina|YCR|Senior / Femenino|102|143|5
ilca-6-20|ILCA 6|20|TORO|GASPAR|YCA|U19 / Masculino|102|152|5
ilca-6-21|ILCA 6|21|Fernandez Alonso|Simon|CNSI|U19 / Masculino|103|205|5
ilca-6-22|ILCA 6|22|Tejada Ibañez|Mateo|SYN|Senior / Masculino|103|205|5
ilca-6-23|ILCA 6|23|Pierson|Dante|CVR|U17 / Masculino|106|208|5
ilca-6-24|ILCA 6|24|Granados|Cristian|RRC|Master / Masculino|107|183|5
ilca-6-25|ILCA 6|25|Favero|Justino|CRLP|U19 / Masculino|107|209|5
ilca-6-26|ILCA 6|26|Burde|Hernan|RRC|Gran Master / Masculino|110|194|5
ilca-6-27|ILCA 6|27|Wenzel|Felipe|CNO|Senior / Masculino|112|163|5
ilca-6-28|ILCA 6|28|De valais|juan cruz|CNSI|U17 / Masculino|115|217|5
ilca-6-29|ILCA 6|29|Isern|Federico|YCR|Master / Masculino|120|171|5
ilca-6-30|ILCA 6|30|Silva Robinson|Juan|CNSI|U17 / Masculino|120|198|5
ilca-6-31|ILCA 6|31|Quijano|Marco|RRC|U19 / Masculino|121|213|5
ilca-6-32|ILCA 6|32|Mones Ruiz|Lucas|CNO|Senior / Masculino|121|223|5
ilca-6-33|ILCA 6|33|Febre Prieto|Federico|CNSI|U17 / Masculino|127|229|5
ilca-6-34|ILCA 6|34|Paglini|Tomas|YCR|Senior / Masculino|127|229|5
ilca-6-35|ILCA 6|35|Caramellino|Juan Ignacio|YCR|Senior / Masculino|128|169|5
ilca-6-36|ILCA 6|36|Rasilla|Tomás|CRLP|Aprendiz de Master / Masculino|131|233|5
ilca-6-37|ILCA 6|37|Llauro|Felipe|CNSI|U17 / Masculino|133|203|5
ilca-6-38|ILCA 6|38|Bodetto|Tomas|YCR|Senior / Masculino|134|236|5
ilca-6-39|ILCA 6|39|Garcia Canteli|Damasia|CNSI|U17 / Femenino|135|225|5
ilca-6-40|ILCA 6|40|Mariño|Gonzalo|YCO|U19 / Masculino|136|218|5
ilca-6-41|ILCA 6|41|García|Segundo|YCR|Senior / Masculino|141|192|5
ilca-6-42|ILCA 6|42|Barcia|Nicolás|CNAs|Senior / Masculino|142|244|5
ilca-6-43|ILCA 6|43|David|Hector|CNC|Gran Master / Masculino|144|188|5
ilca-6-44|ILCA 6|44|Vazquez Fontana|Franco|CVB|U17 / Masculino|144|210|5
ilca-6-45|ILCA 6|45|Pierson|Bruno|CVR|Senior / Masculino|147|198|5
ilca-6-46|ILCA 6|46|D'Agostino|Sofia Alejandra|CVB|Senior / Femenino|148|204|5
ilca-6-47|ILCA 6|47|Albarello Arena|Augusto|CUBA|Senior / Masculino|148|250|5
ilca-6-48|ILCA 6|48|Alemandi|Guido|YCR|Senior / Masculino|149|200|5
ilca-6-49|ILCA 6|49|Capizzano|Alejandro|CNMP|Gran Master / Masculino|151|253|5
ilca-6-50|ILCA 6|50|Sinner|Juan Ignacio|CNSI|Senior / Masculino|152|254|5
ilca-6-51|ILCA 6|51|Insua|Agustin|YCB|U19 / Masculino|153|255|5
ilca-6-52|ILCA 6|52|Pinedo Chiappa|Lautaro|CRLP|U17 / Masculino|156|258|5
ilca-6-53|ILCA 6|53|Prat|Joaquín|CRSN|U19 / Masculino|158|260|5
ilca-6-54|ILCA 6|54|SACCHI|HILARIO|YCA|/ Masculino|158|260|5
ilca-6-55|ILCA 6|55|Jordana|Verónica|CPNLB|Master / Femenino|159|223|5
ilca-6-56|ILCA 6|56|Corvalan|Jose|400YCC|Gran Master / Masculino|160|218|5
ilca-6-57|ILCA 6|57|Cusinato|Santiago|CPNLB|U17 / Masculino|161|263|5
ilca-6-58|ILCA 6|58|Panal|Facundo|YCA|Senior / Masculino|162|264|5
ilca-6-59|ILCA 6|59|Saguier|Agustín|YCA|Senior / Masculino|163|251|5
ilca-6-60|ILCA 6|60|Berger|Felipe|YCB|U17 / Masculino|163|265|5
ilca-6-61|ILCA 6|61|Masetro|Adrián|CVR|Master / Masculino|164|226|5
ilca-6-62|ILCA 6|62|Noceti|Rocky|CVR|Great gran master / Masculino|164|244|5
ilca-6-63|ILCA 6|63|May|Francisco|CPNLB|Aprendiz de Master / Masculino|164|250|5
ilca-6-64|ILCA 6|64|Raineri|Pablo|CVR|Master / Masculino|164|258|5
ilca-6-65|ILCA 6|65|Folguera Cichowolski|Alejo|CPNLB|Senior / Masculino|164|260|5
ilca-6-66|ILCA 6|66|SOARES NETTO|GUILLERMO|CPNLB|Gran Master / Masculino|164|262|5
ilca-6-67|ILCA 6|67|Ferrara|Sabrina|CVR|Aprendiz de Master / Femenino|164|264|5
ilca-7-1|ILCA 7|1|Pinto|Pedro Paulo|CNO|Senior / Masculino|13|21|5
ilca-7-2|ILCA 7|2|Cardozo|Juan Pablo|YCO|Senior / Masculino|16|43|5
ilca-7-3|ILCA 7|3|Galvan|Joaquin|YCO|Senior / Masculino|19|53|5
ilca-7-4|ILCA 7|4|Gomez|Francisco|CNSP|Senior / Masculino|28|55|5
ilca-7-5|ILCA 7|5|Castelari Rivas|Nicolás|YCR|Senior / Masculino|31|58|5
ilca-7-6|ILCA 7|6|Gabasio|Carlos|CVR|Senior / Masculino|36|56|5
ilca-7-7|ILCA 7|7|Rodriguez Reynoso|Pedro|CNO|Senior / Masculino|39|73|5
ilca-7-8|ILCA 7|8|Elías|Tomás Bautista|CUBA|Senior / Masculino|41|75|5
ilca-7-9|ILCA 7|9|Heredia|Andres|YCO|Aprendiz de Master / Masculino|41|75|5
ilca-7-10|ILCA 7|10|Galvan|Benjamin|YCO|Senior / Masculino|42|58|5
ilca-7-11|ILCA 7|11|Suarez fabbro|Ramiro|CNC|Senior / Masculino|43|70|5
ilca-7-12|ILCA 7|12|Del Pero|Ignacio|CVB|Senior / Masculino|45|72|5
ilca-7-13|ILCA 7|13|Rigoni|Mariano|CUBA|Aprendiz de Master / Masculino|47|81|5
ilca-7-14|ILCA 7|14|Colla|Alejandro|CVR|Gran Master / Masculino|48|66|5
ilca-7-15|ILCA 7|15|García|Segundo|YCR|Senior / Masculino|50|84|5
ilca-7-16|ILCA 7|16|guaragna rigonat|francisco|CNJ|Senior / Masculino|51|85|5
ilca-7-17|ILCA 7|17|Vugdelija|Juan|CUBA|Aprendiz de Master / Masculino|53|87|5
ilca-7-18|ILCA 7|18|Hernández|Rufino Sebastián|CNSP|Master / Masculino|57|83|5
ilca-7-19|ILCA 7|19|Pascual|Agustín|YCO|Aprendiz de Master / Masculino|62|96|5
ilca-7-20|ILCA 7|20|Sinner|Juan Ignacio|CNSI|Senior / Masculino|62|96|5
ilca-7-21|ILCA 7|21|Mones Ruiz|Lucas|CNO|Senior / Masculino|63|97|5
ilca-7-22|ILCA 7|22|Márquez|Luis Matias|CVR|Aprendiz de Master / Masculino|64|98|5
ilca-7-23|ILCA 7|23|Goris|Manuel|CNZ|Senior / Masculino|65|99|5
ilca-7-24|ILCA 7|24|Bodetto|Tomas|YCR|Senior / Masculino|66|93|5
ilca-7-25|ILCA 7|25|Wenzel|Felipe|CNO|Senior / Masculino|66|100|5
ilca-7-26|ILCA 7|26|Rigoni|Matias|CUBA|Aprendiz de Master / Masculino|68|102|5
ilca-7-27|ILCA 7|27|Sandrk|Mirko|N/A|Senior / Masculino|69|103|5
ilca-7-28|ILCA 7|28|Deho'|Thomas|YCO|Senior / Masculino|70|104|5
ilca-7-29|ILCA 7|29|Giudice|Rodolfo|CRLP|Gran Master / Masculino|70|104|5
ilca-7-30|ILCA 7|30|Ines|Ariel|CRSN|Gran Master / Masculino|70|104|5
ilca-7-31|ILCA 7|31|Latorre|Santiago|YCA|U19 / Masculino|70|104|5
`.trim();

const rankings = rankingText.split("\n").map((line) => {
    const [
        id,
        className,
        position,
        lastName,
        firstName,
        club,
        category,
        netPoints,
        totalPoints,
        events
    ] = line.split("|");

    return {
        id,
        className,
        position: Number(position),
        lastName,
        firstName,
        name: `${firstName} ${lastName}`,
        club,
        category,
        netPoints: Number(netPoints),
        totalPoints: Number(totalPoints),
        events: Number(events)
    };
});

export default rankings;