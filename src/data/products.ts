export interface Product {
  species: string;
  internalCode: string;
  description: string;
  ean13: string;
  dun14: string;
  boxWeight: string;
  pctWeight: string;
  unitsPerBox: string;
  ncm: string;
  images?: string[];
  pricePerKg?: number;
}

export const products: Product[] = [
  { species: "TAMBATINGA", internalCode: "1", description: "CABEÇA E ESPINHAÇO DE TAMBATINGA", ean13: "7898962477076", dun14: "", boxWeight: "21 KG", pctWeight: "1,36", unitsPerBox: "17 ~", ncm: "03048990", pricePerKg: 9.90, images: ["/images/cod1.jpg", "https://i.ibb.co/1YjKrHXP/1-SUAN-DE-TAMB.jpg"] },
  { species: "TAMBATINGA", internalCode: "3", description: "TAMBATINGA EM PEDAÇOS SEM ESCAMA (BANDA) SEM ESPINHO", ean13: "7898962477090", dun14: "97898962477093", boxWeight: "10 KG", pctWeight: "0,83", unitsPerBox: "14 ~", ncm: "03038990", pricePerKg: 37.50, images: ["/images/cod3.jpg", "https://i.postimg.cc/v8WBxg4Q/3-BANDA-DE-TAMBATINGA-SEM-ESPINHA-SEM-ESCAMA-SEM-CABECA.jpg", "/images/cod3_1.jpg", "/images/cod3_2.png"] },
  { species: "TAMBATINGA", internalCode: "5", description: "PEIXE CONGELADO - TAMBATINGA EVISC. C/ CABEÇA S/ ESCAMA", ean13: "7898962477250", dun14: "97898962477253", boxWeight: "20 KG", pctWeight: "1,80", unitsPerBox: "VARIÁVEL", ncm: "03038990", pricePerKg: 18.50, images: ["/images/cod5.png", "https://i.ibb.co/LzVTS0PT/Tambatinga-Eviscerada-COM-cabe-a.png"] },
  { species: "TAMBATINGA", internalCode: "6", description: "TAMBATINGA SEM ESPINHA COM CABEÇA", ean13: "7898962477267", dun14: "97898962477260", boxWeight: "11 KG", pctWeight: "2,04", unitsPerBox: "VARIÁVEL", ncm: "03038990" },
  { species: "PINTADO", internalCode: "7", description: "CABECA E ESPINHAÇO DE PINTADO", ean13: "7898962477014", dun14: "", boxWeight: "20 KG", pctWeight: "1,35", unitsPerBox: "17 ~", ncm: "03049900" },
  { species: "PINTADO", internalCode: "8", description: "PINTADO DA AMAZONIA POSTAS (FOOD)", ean13: "7898962477120", dun14: "", boxWeight: "19 KG", pctWeight: "1,07", unitsPerBox: "", ncm: "03028990" },
  { species: "PINTADO", internalCode: "11", description: "BANDA DE PINTADO DA AMAZONIA", ean13: "7898962477038", dun14: "97898962477031", boxWeight: "13 KG", pctWeight: "0,84", unitsPerBox: "10 / 16", ncm: "03043290" },
  { species: "PINTADO", internalCode: "13", description: "PINTADO DA AMAZÔNIA EVISCERADO INTEIRO", ean13: "7898962477335", dun14: "97898962477338", boxWeight: "18 KG", pctWeight: "1,49", unitsPerBox: "VARIÁVEL", ncm: "03028933" },
  { species: "TAMBATINGA", internalCode: "14", description: "CABEÇA E POSTA DE TAMBATINGA SEM ESCAMA", ean13: "7898962477083", dun14: "#N/D", boxWeight: "11 KG", pctWeight: "1,17", unitsPerBox: "", ncm: "" },
  { species: "PINTADO", internalCode: "23", description: "PINTADO DA AMAZÔNIA FILÉ SEM PELE INTEIRO", ean13: "7898962477199", dun14: "97898962477192", boxWeight: "10 KG", pctWeight: "0,57", unitsPerBox: "11 / 16", ncm: "03028933" },
  { species: "TAMBATINGA", internalCode: "25", description: "VENTRECHA DE TAMBATINGA (FOOD)", ean13: "7898962477236", dun14: "", boxWeight: "12 KG", pctWeight: "0,57", unitsPerBox: "", ncm: "03028933" },
  { species: "TAMBATINGA", internalCode: "26", description: "FILE DE TAMBATINGA EM PEDAÇOS S/ PELE (FOOD)", ean13: "7898962477373", dun14: "", boxWeight: "20 KG", pctWeight: "1,15", unitsPerBox: "", ncm: "03048990" },
  { species: "TAMBATINGA", internalCode: "28", description: "TAMBATINGA FILE EM PEDAÇOS COM PELE (CAUDA)", ean13: "7898962477304", dun14: "97898962477307", boxWeight: "20 KG", pctWeight: "0,99", unitsPerBox: "20 / 22", ncm: "03048990" },
  { species: "PINTADO", internalCode: "30", description: "PINTADO FILÉ S/PELE EM PEDAÇOS (FOOD)", ean13: "7898962477212", dun14: "97898962477116", boxWeight: "13 KG", pctWeight: "1,05", unitsPerBox: "", ncm: "03028933" },
  { species: "TAMBATINGA", internalCode: "50", description: "CARNE MOÍDA CONGELADA DE PEIXE TAMBATINGA", ean13: "7898962477380", dun14: "97898962477383", boxWeight: "10 KG", pctWeight: "1,06", unitsPerBox: "", ncm: "03049900" },
  { species: "TAMBATINGA", internalCode: "55", description: "TAMB. C/ ESCAMA C/ CABEÇA ESVICERADA C/ ESPINHA", ean13: "7898962477434", dun14: "", boxWeight: "24 KG", pctWeight: "2,11", unitsPerBox: "", ncm: "03028933" },
  { species: "PIAUÇU", internalCode: "108", description: "PIAUÇU EVISCERADO S/ ESCAMAS E C/ ESPINHOS", ean13: "7898962477403", dun14: "", boxWeight: "11 KG", pctWeight: "1,25", unitsPerBox: "", ncm: "03038955" },
  { species: "PIAUÇU", internalCode: "109", description: "PIAUÇU EVISCERADO C/ ESCAMAS E C/ ESPINHOS", ean13: "7898962477397", dun14: "#N/D", boxWeight: "7 KG", pctWeight: "1,25", unitsPerBox: "", ncm: "" },
  { species: "TILAPIA INTEIRA", internalCode: "1677", description: "TILAPIA EVISCERADA SEM ESCAMAS", ean13: "7898962477458", dun14: "", boxWeight: "22 KG", pctWeight: "1,01", unitsPerBox: "", ncm: "" },
  { species: "TAMBATINGA", internalCode: "1934", description: "PEIXE RESFRIADO - TAMBATINGA DESCAMADA C/ CABEÇA", ean13: "7898962477472", dun14: "#N/D", boxWeight: "18 KG", pctWeight: "1,98", unitsPerBox: "", ncm: "03043290" },
  { species: "TAMBATINGA", internalCode: "1935", description: "PEIXE RESFRIADO - TAMBATINGA EVISCERADA COM CABEÇA", ean13: "7898962477489", dun14: "#N/D", boxWeight: "18 KG", pctWeight: "2,23", unitsPerBox: "", ncm: "03043290" },
  { species: "PINTADO", internalCode: "1936", description: "PEIXE RESFRIADO - PINTADO DA AMAZÔNIA EVISCERADO", ean13: "7898962477496", dun14: "#N/D", boxWeight: "17 KG", pctWeight: "1,68", unitsPerBox: "", ncm: "03043290" },
  { species: "TILAPIA FILE", internalCode: "2291", description: "FILE DE TILAPIA SEM PELE FOOD", ean13: "7898962477526", dun14: "", boxWeight: "19 KG", pctWeight: "1,00", unitsPerBox: "", ncm: "03043290" },
  { species: "TAMBATINGA", internalCode: "3608", description: "TAMBATINGA POSTA COM ESPINHO FOOD", ean13: "7898962477571", dun14: "97898973870005", boxWeight: "19 KG", pctWeight: "1,07", unitsPerBox: "", ncm: "03038990" },
  { species: "TAMBATINGA", internalCode: "3612", description: "TAMBATINGA EM PEDAÇOS SEM ESCAMA (BANDA) COM CABEÇA", ean13: "7898962477564", dun14: "", boxWeight: "12 KG", pctWeight: "0,90", unitsPerBox: "", ncm: "03043290" },
  { species: "TAMBATINGA", internalCode: "4998", description: "TAMBATINGA COSTELA SEM ESCAMA (COSTELA GRILL) FOOD", ean13: "7898962477625", dun14: "97898962477628", boxWeight: "9 KG", pctWeight: "0,43", unitsPerBox: "22,00", ncm: "03028990" },
  { species: "TAMBATINGA", internalCode: "5061", description: "TAMBATINGA BANDA C/ ESCAMA C/ CABEÇA S/ ESPINHO", ean13: "7898962477670", dun14: "", boxWeight: "21 KG", pctWeight: "1,51", unitsPerBox: "", ncm: "03043290" },
  { species: "TAMBAQUI", internalCode: "5635", description: "TAMBAQUI EM PEDAÇOS SEM ESCAMA (BANDA) SEM ESPINHO", ean13: "7898962477663", dun14: "97898962477666", boxWeight: "9 KG", pctWeight: "0,73", unitsPerBox: "10 / 16", ncm: "03043290" },
  { species: "TAMBAQUI", internalCode: "5646", description: "TAMBAQUI EM PEDAÇOS SEM ESCAMA (BANDA) COM CABEÇA", ean13: "7898962477717", dun14: "97898962477710", boxWeight: "11 KG", pctWeight: "0,90", unitsPerBox: "10 / 16", ncm: "03038990" },
  { species: "TAMBAQUI", internalCode: "5649", description: "TAMBAQUI COSTELA SEM ESCAMA (COSTELA GRILL) FOOD", ean13: "7898962477724", dun14: "97898962477727", boxWeight: "12 KG", pctWeight: "0,60", unitsPerBox: "22,00", ncm: "03048990" },
  { species: "TAMBAQUI", internalCode: "5684", description: "VENTRECHA DE TAMBAQUI (FOOD)", ean13: "7898962477762", dun14: "97898962477765", boxWeight: "8 KG", pctWeight: "0,51", unitsPerBox: "", ncm: "03043290" },
  { species: "TAMBAQUI", internalCode: "5686", description: "TAMBAQUI POSTA (A PALITO) FOOD", ean13: "7898962477779", dun14: "", boxWeight: "12 KG", pctWeight: "0,52", unitsPerBox: "", ncm: "03043290" },
  { species: "TAMBAQUI", internalCode: "5687", description: "TAMBAQUI COM CABEÇA / SEM ESCAMA / SEM ESPINHO", ean13: "7898962477786", dun14: "97898962477789", boxWeight: "11 KG", pctWeight: "2,13", unitsPerBox: "", ncm: "03028933" },
  { species: "TAMBAQUI", internalCode: "5706", description: "TAMBAQUI LOMBO COM PELE", ean13: "7898962477809", dun14: "", boxWeight: "9 KG", pctWeight: "0,44", unitsPerBox: "10 / 12", ncm: "03043290" },
  { species: "TAMBATINGA", internalCode: "5710", description: "TAMBAQUI EVISCERADO C/ CABEÇA S/ ESCAMA", ean13: "7898962477847", dun14: "97898962477840", boxWeight: "22 KG", pctWeight: "1,76", unitsPerBox: "", ncm: "03043290" },
  { species: "TAMBAQUI", internalCode: "5763", description: "CARNE MOIDA DE TAMBAQUI (FOOD)", ean13: "7898962477885", dun14: "97898962477888", boxWeight: "14 KG", pctWeight: "1,06", unitsPerBox: "", ncm: "03043290" },
  { species: "TAMBATINGA", internalCode: "5863", description: "TAMBATINGA POSTA (À PALITO) PC 400G", ean13: "7898962477908", dun14: "17898962477905", boxWeight: "10 KG", pctWeight: "0,40", unitsPerBox: "25", ncm: "03048990", pricePerKg: 29.90 },
  { species: "TAMBATINGA", internalCode: "5864", description: "PEIXE CONGELADO - TAMBATINGA VENTRECHA SEM ESPINHO PC 400G", ean13: "7898962477915", dun14: "17898962477912", boxWeight: "10 KG", pctWeight: "0,40", unitsPerBox: "25", ncm: "03038990", pricePerKg: 34.50 },
  { species: "TAMBATINGA", internalCode: "5865", description: "TAMBATINGA EM PEDAÇOS (COSTELA À PALITO) PC 400G", ean13: "7898962477922", dun14: "17898962477929", boxWeight: "10 KG", pctWeight: "0,40", unitsPerBox: "25", ncm: "03048990", pricePerKg: 33.00, images: ["/images/cod5865.jpg", "https://i.ibb.co/KcCzvr9P/5865-PEIXE-CONGELADO-TAMBATINGA-EM-PEDA-OS-COSTELA-PALITO-PC-400-G.jpg"] },
  { species: "TAMBATINGA", internalCode: "5866", description: "TAMBATINGA FILE EM PEDAÇOS SEM PELE PC 400G", ean13: "7898962477939", dun14: "17898962477936", boxWeight: "10 KG", pctWeight: "0,40", unitsPerBox: "25", ncm: "03048990", pricePerKg: 36.50 },
  { species: "PINTADO", internalCode: "5868", description: "PEIXE CONGELADO - PINTADO FILE EM PEDAÇOS SEM PELE PC 400G", ean13: "7898962477953", dun14: "17898962477950", boxWeight: "10 KG", pctWeight: "0,40", unitsPerBox: "25", ncm: "03043290", pricePerKg: 39.90 },
  { species: "TILAPIA FILE", internalCode: "7329", description: "FILE DE TILAPIA SEM PELE PC 400G", ean13: "7898973870064", dun14: "17898973870061", boxWeight: "10 KG", pctWeight: "0,40", unitsPerBox: "25", ncm: "03043290", pricePerKg: 46.50 },
  { species: "PINTADO", internalCode: "7454", description: "PINTADO DA AMAZÔNIA POSTAS PC 600G", ean13: "7898973870071", dun14: "17898973870078", boxWeight: "12 KG", pctWeight: "0,60", unitsPerBox: "20", ncm: "03048990", pricePerKg: 37.50 },
  { species: "TAMBATINGA", internalCode: "7455", description: "TAMBATINGA POSTA COM ESPINHO PC 600G", ean13: "7898973870088", dun14: "17898973870085", boxWeight: "12 KG", pctWeight: "0,60", unitsPerBox: "20", ncm: "03038990", pricePerKg: 28.00 },
  { species: "TAMBAQUI", internalCode: "7468", description: "TAMBAQUI POSTA (À PALITO) PC 600G", ean13: "7898973870095", dun14: "17898973870092", boxWeight: "12 KG", pctWeight: "0,60", unitsPerBox: "20", ncm: "03028990", pricePerKg: 29.00 },
  { species: "TAMBAQUI", internalCode: "7642", description: "TAMBAQUI EM PEDAÇOS (COSTELA À PALITO) PC 400G", ean13: "7898973870118", dun14: "17898973870115", boxWeight: "10 KG", pctWeight: "0,40", unitsPerBox: "25", ncm: "03043290", pricePerKg: 32.50 },
  { species: "TAMBAQUI", internalCode: "7654", description: "TAMBAQUI VENTRECHA SEM ESPINHO PC 400G", ean13: "7898973870125", dun14: "17898973870122", boxWeight: "10 KG", pctWeight: "0,40", unitsPerBox: "25", ncm: "03048990", pricePerKg: 34.00 },
  { species: "TAMBAQUI", internalCode: "8094", description: "TAMBAQUI FILE EM PEDAÇOS SEM PELE PC 400G", ean13: "7898973870149", dun14: "17898973870146", boxWeight: "10 KG", pctWeight: "0,40", unitsPerBox: "25", ncm: "03043290", pricePerKg: 35.50 },
  { species: "TAMBAQUI", internalCode: "8514", description: "CARNE MOIDA DE TAMBAQUI 600G", ean13: "7898973870217", dun14: "17898973870214", boxWeight: "12 KG", pctWeight: "0,60", unitsPerBox: "20", ncm: "03043290", pricePerKg: 22.00 },
  { species: "TAMBAQUI", internalCode: "8515", description: "CARNE MOIDA DE TAMBAQUI 400G", ean13: "7898973870224", dun14: "17898973870221", boxWeight: "10 KG", pctWeight: "0,40", unitsPerBox: "25", ncm: "03049900", pricePerKg: 22.50 },
  { species: "TILAPIA FILE", internalCode: "8516", description: "FILE DE TILÁPIA SEM PELE PC 800G", ean13: "7898973870231", dun14: "17898973870238", boxWeight: "10 KG", pctWeight: "0,80", unitsPerBox: "12", ncm: "03046100", pricePerKg: 47.90 },
];
