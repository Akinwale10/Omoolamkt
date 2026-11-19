const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeUrl=value=>{try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:''}catch{return ''}};
export default async function handler(req,res){
  const slug=String(req.query?.slug||'').trim();
  if(!slug||slug.length>180)return res.status(400).send('Invalid product link');
  const base=(process.env.VITE_SUPABASE_URL||process.env.SUPABASE_URL||'').replace(/\/$/,'');
  const key=process.env.VITE_SUPABASE_ANON_KEY||process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY||'';
  if(!base||!key)return res.status(503).send('Product sharing is temporarily unavailable.');
  try{
    const query=new URLSearchParams({select:'name,slug,description,price,image_url,images,is_active',slug:'eq.'+slug,is_active:'eq.true',limit:'1'});
    const response=await fetch(base+'/rest/v1/products?'+query.toString(),{headers:{apikey:key,Authorization:'Bearer '+key}});
    if(!response.ok)throw new Error('Product lookup failed');
    const rows=await response.json();
    const product=rows?.[0];
    if(!product)return res.status(404).send('This product is no longer available.');
    const origin='https://omoolasupermarket.vercel.app';
    const productUrl=origin+'/product/'+encodeURIComponent(product.slug);
    const image=safeUrl(product.image_url||(Array.isArray(product.images)?product.images[0]:''));
    const title=product.name+' | Omoola Supermarket Stores';
    const description=(product.description||('Shop '+product.name+' at Omoola Supermarket Stores. View product details and order online.')).slice(0,300);
    const price=Number(product.price)>0?Number(product.price).toFixed(2):'';
    const redirect=JSON.stringify(productUrl).replace(/</g,'\\u003c');
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=0, s-maxage=60, stale-while-revalidate=120');
    return res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(productUrl)}"><meta property="og:type" content="product"><meta property="og:site_name" content="Omoola Supermarket Stores"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(origin+'/share/'+encodeURIComponent(product.slug))}">${image?`<meta property="og:image" content="${esc(image)}"><meta property="og:image:secure_url" content="${esc(image)}"><meta property="og:image:alt" content="${esc(product.name)}">`:''}<meta name="twitter:card" content="${image?'summary_large_image':'summary'}"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}">${image?`<meta name="twitter:image" content="${esc(image)}">`:''}${price?`<meta property="product:price:amount" content="${price}"><meta property="product:price:currency" content="NGN">`:''}<meta name="robots" content="index,follow"><script>window.location.replace(${redirect});</script></head><body><p>Opening ${esc(product.name)} at <a href="${esc(productUrl)}">Omoola Supermarket Stores</a>…</p></body></html>`);
  }catch(error){console.error('Product share page error:',error);return res.status(500).send('Unable to load this product right now.');}
}