export const demoCategories=[
{name:'Groceries & Foodstuffs',slug:'groceries-foodstuffs',image_url:'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900',description:'Everyday food essentials'},
{name:'Beverages & Drinks',slug:'beverages-drinks',image_url:'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=900',description:'Refreshing drinks for every moment'},
{name:'Provisions',slug:'provisions',image_url:'https://images.unsplash.com/photo-1604719312566-8912e9c8a213?w=900',description:'Pantry favourites and essentials'},
{name:'Toiletries',slug:'toiletries',image_url:'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=900',description:'Daily personal care'},
{name:'Cosmetics & Personal Care',slug:'cosmetics-personal-care',image_url:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900',description:'Beauty and self-care'},
{name:'Household Essentials',slug:'household-essentials',image_url:'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=900',description:'Make home feel like home'},
{name:'Supermarket Specials',slug:'supermarket-specials',image_url:'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=900',description:'Great finds and special offers'}
];
export const demoProducts=[
{id:'demo-1',name:'Peak Full Cream Milk',slug:'peak-full-cream-milk',sku:'DEMO-001',description:'A creamy everyday milk choice for the whole family.',price:4500,compare_at_price:null,image_url:'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=900',stock_quantity:24,is_featured:true,category:{name:'Beverages & Drinks',slug:'beverages-drinks'}},
{id:'demo-2',name:'Milo Active-Go',slug:'milo-active-go',sku:'DEMO-002',description:'A delicious malt beverage for an energising start.',price:6200,compare_at_price:null,image_url:'https://images.unsplash.com/photo-1517093157656-b9ecf8c9e7a5?w=900уп',stock_quantity:18,is_featured:true,category:{name:'Beverages & Drinks',slug:'beverages-drinks'}},
{id:'demo-3',name:'Golden Morn',slug:'golden-morn',sku:'DEMO-003',description:'A nourishing cereal breakfast favourite.',price:3800,compare_at_price:null,image_url:'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=900',stock_quantity:16,is_featured:true,category:{name:'Groceries & Foodstuffs',slug:'groceries-foodstuffs'}},
{id:'demo-4',name:'Premium Long Grain Rice',slug:'premium-long-grain-rice',sku:'DEMO-004',description:'Quality long-grain rice for everyday meals.',price:0,compare_at_price:null,image_url:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=900',stock_quantity:0,is_featured:true,category:{name:'Groceries & Foodstuffs',slug:'groceries-foodstuffs'}},
{id:'demo-5',name:'Tomato Pasta',slug:'tomato-pasta',sku:'DEMO-005',description:'A pantry staple for quick and tasty meals.',price:1800,compare_at_price:null,image_url:'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=900',stock_quantity:30,is_featured:false,category:{name:'Provisions',slug:'provisions'}},
{id:'demo-6',name:'Household Cleaning Essentials',slug:'household-cleaning-essentials',sku:'DEMO-006',description:'Useful home-care essentials for a fresh home.',price:0,compare_at_price:null,image_url:'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=900',stock_quantity:0,is_featured:false,category:{name:'Household Essentials',slug:'household-essentials'}}
];
export const naira=n=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(Number(n||0));
export const STORE={name:'OMOOLA SUPERMARKET STORES',phone:'08117276772',whatsapp:'2348117276772',address:'3, Ishaga Bus Stop, Opposite The Gem International School, Ilaro Road, Owode Yewa, Ogun State, Nigeria'};
