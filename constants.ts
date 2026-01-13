
import { TobaccoProduct } from './types';

export const CSV_DATA = `"Trade Name","Packaging/Brand Style",UPC,"Carton Name","UPC (Carton or Roll)",Manufacturer
"1839 Blue 100s Filtered Cigarettes","20 ct Box",879982001196,"10 pk Carton",879982001233,"U.S. FLUE-CURED TOBACCO GROWERS, INC."
"1839 Blue King Filtered Cigarettes","20 ct Box",879982000885,"10 pk Carton",879982000892,"U.S. FLUE-CURED TOBACCO GROWERS, INC."
"1839 Blue Premium (16 oz) Pipe Tobacco","1 ct Bag",879982002919,,,"U.S. FLUE-CURED TOBACCO GROWERS, INC."
"1839 Blue Premium (16 oz) Roll Your Own Tobacco","1 ct Bag",187700000988,,,"U.S. FLUE-CURED TOBACCO GROWERS, INC."
"1839 Blue Premium (6 oz) Pipe Tobacco","1 ct Bag",879982002858,,,"U.S. FLUE-CURED TOBACCO GROWERS, INC."
"1839 Blue Premium (6 oz) Roll Your Own Tobacco","1 ct Bag",187700000957,,,"U.S. FLUE-CURED TOBACCO GROWERS, INC."
"1839 Red 100s Filtered Cigarettes","20 ct Box",879982001189,"10 pk Carton",879982001226,"U.S. FLUE-CURED TOBACCO GROWERS, INC."
"1839 Red King Filtered Cigarettes","20 ct Box",879982000854,"10 pk Carton",879982000861,"U.S. FLUE-CURED TOBACCO GROWERS, INC."
"1839 Red Premium (16 oz) Pipe Tobacco","1 ct Bag",879982002926,,,"U.S. FLUE-CURED TOBACCO GROWERS, INC."
"1839 Red Premium (16 oz) Roll Your Own Tobacco","1 ct Bag",187700000971,,,"U.S. FLUE-CURED TOBACCO GROWERS, INC."
"1839 Red Premium (6 oz) Pipe Tobacco","1 ct Bag",879982002865,,,"U.S. FLUE-CURED TOBACCO GROWERS, INC."
"1839 Red Premium (6 oz) Roll Your Own Tobacco","1 ct Bag",187700000940,,,"U.S. FLUE-CURED TOBACCO GROWERS, INC."
"1839 Silver 100s Filtered Cigarettes","20 ct Box",879982001202,"10 pk Carton",879982001240,"U.S. FLUE-CURED TOBACCO GROWERS, INC."
"1839 Silver King Filtered Cigarettes","20 ct Box",879982001158,"10 pk Carton",879982001165,"U.S. FLUE-CURED TOBACCO GROWERS, INC."
"Basic 100s Filtered Cigarettes","20 ct Box",028200304025,"10 pk Carton",028200304018,"Philip Morris USA"
"Basic Blue Pack 100s Filtered Cigarettes","20 ct Box",028200303622,"10 pk Carton",028200303615,"Philip Morris USA"
"Marlboro 100s Filtered Cigarettes","20 ct Box",02836328,"10 pk Carton",028200136305,"Philip Morris USA"
"Newport Non-Menthol 100s Filtered Cigarettes","20 ct Box",02665715,"10 pk Carton",026100806571,"R.J. Reynolds Tobacco Company"
"Lucky Strike Red 100s Filtered Cigarettes","20 ct Box",043300109264,"10 pk Carton",043300109271,"R.J. Reynolds Tobacco Company"
"Vuse Alto Golden Tobacco 5 % (1.8 mL) Closed E-Liquid Pods","2 ct Box",849205019345,"5 pk Carton",849205019352,"R.J. Reynolds Vapor Company"
"JUUL Virginia Tobacco 5 % (0.7 mL) Closed E-Liquid JUULpods","4 ct Box",819913011429,,,"Juul Labs, Inc."
"Zyn Original 6 mg Nicotine Pouches","15 ct Can",930057,"5 pk Roll",930156,"Swedish Match North America LLC"`;

export const parseCSV = (csv: string): Map<string, TobaccoProduct> => {
  const lines = csv.split('\n');
  const products = new Map<string, TobaccoProduct>();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!parts) continue;
    
    const clean = (s: string) => s?.replace(/^"|"$/g, '').trim() || '';
    
    const product: TobaccoProduct = {
      tradeName: clean(parts[0]),
      packagingStyle: clean(parts[1]),
      upc: clean(parts[2]),
      cartonName: clean(parts[3]),
      cartonUpc: clean(parts[4]),
      manufacturer: clean(parts[5]),
    };
    
    if (product.upc) products.set(product.upc, product);
    if (product.cartonUpc) products.set(product.cartonUpc, product);
  }
  
  return products;
};
