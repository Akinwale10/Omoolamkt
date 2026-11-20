import React,{createContext,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {supabase,supabaseReady} from '../lib/supabase';
const C=createContext(null); export const useStore=()=>useContext(C);
export function StoreProvider({children}){
 const [products,setProducts]=useState([]),[categories,setCategories]=useState([]),[banners,setBanners]=useState([]),[settings,setSettings]=useState(null),[loading,setLoading]=useState(true),[catalogueError,setCatalogueError]=useState(''),[cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('omoola-cart')||'[]')}catch{return[]}});
 const [session,setSession]=useState(null),[admin,setAdmin]=useState(false);
 const requestId=useRef(0);
 const load=async({silent=false}={})=>{
  const current=++requestId.current;
  if(!supabaseReady||!supabase){setProducts([]);setCategories([]);setBanners([]);setSettings(null);setCatalogueError('The live store database is not configured.');setLoading(false);console.error('Live catalogue unavailable: Supabase environment variables are missing.');return}
  if(!silent)setLoading(true);
  try{
   // Public storefront reads use the same Supabase project and shared database as the admin dashboard.
   // Keep product reads independent from optional category/banner/settings requests.
   const [categoryResult,bannerResult,settingsResult,countResult]=await Promise.all([
    supabase.from('categories').select('*').eq('is_active',true).order('sort_order'),
    supabase.from('promotional_banners').select('*').eq('is_active',true).order('sort_order'),
    supabase.from('website_settings').select('*').limit(1).maybeSingle(),
    supabase.from('products').select('id',{count:'exact',head:true}).eq('is_active',true)
   ]);
   const categoryRows=categoryResult.error?[]:(categoryResult.data||[]);
   const bannerRows=bannerResult.error?[]:(bannerResult.data||[]);
   if(countResult.error)throw new Error('Public product catalogue count failed: '+countResult.error.message);
   const totalProducts=countResult.count||0;
   const pageSize=500;
   const offsets=Array.from({length:Math.ceil(totalProducts/pageSize)},(_,index)=>index*pageSize);
   const pages=await Promise.all(offsets.map(offset=>supabase.from('products').select('*').eq('is_active',true).order('created_at',{ascending:false}).range(offset,offset+pageSize-1)));
   const failedPage=pages.find(result=>result.error);
   if(failedPage)throw new Error('Public product catalogue read failed: '+failedPage.error.message);
   const productRows=pages.flatMap(result=>result.data||[]);
   if(current!==requestId.current)return;
   const categoryMap=new Map(categoryRows.map(category=>[category.id,category]));
   setProducts(productRows.map(product=>({...product,category:categoryMap.get(product.category_id)||null})));
   setCategories(categoryRows);
   setBanners(bannerRows);
   setSettings(settingsResult.error?null:(settingsResult.data||null));
   setCatalogueError('');
   if(categoryResult.error)console.error('Omoola categories could not be loaded:',categoryResult.error);
   if(bannerResult.error)console.error('Omoola homepage banners could not be loaded:',bannerResult.error);
   if(settingsResult.error)console.error('Omoola website settings could not be loaded:',settingsResult.error);
  }catch(error){
   if(current!==requestId.current)return;
   console.error('Unable to load Omoola public product catalogue:',error);
   setCatalogueError(error.message||'The store catalogue could not be loaded.');
   setProducts([]);
   setCategories([]);
   setBanners([]);
  }finally{if(current===requestId.current)setLoading(false)}
 };
 useEffect(()=>{
  load();
  if(!supabaseReady||!supabase)return;
  let refreshPending=false;
  let refreshAgain=false;
  const refresh=()=>{
   if(document.visibilityState==='hidden')return;
   if(refreshPending){refreshAgain=true;return}
   refreshPending=true;
   load({silent:true}).finally(()=>{refreshPending=false;if(refreshAgain){refreshAgain=false;refresh()}});
  };
  const live=supabase.channel('omoola-public-catalogue')
   .on('postgres_changes',{event:'*',schema:'public',table:'products'},refresh)
   .on('postgres_changes',{event:'*',schema:'public',table:'categories'},refresh)
   .on('postgres_changes',{event:'*',schema:'public',table:'promotional_banners'},refresh)
   .subscribe(status=>{if(status==='SUBSCRIBED')refresh();else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')console.error('Omoola live catalogue realtime connection:',status)});
  window.addEventListener('focus',refresh);
  window.addEventListener('pageshow',refresh);
  window.addEventListener('online',refresh);
  document.addEventListener('visibilitychange',refresh);
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,nextSession)=>setSession(nextSession));
  supabase.auth.getSession().then(({data})=>setSession(data.session));
  return()=>{subscription.unsubscribe();supabase.removeChannel(live);window.removeEventListener('focus',refresh);window.removeEventListener('pageshow',refresh);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',refresh)};
 },[]);
 useEffect(()=>{localStorage.setItem('omoola-cart',JSON.stringify(cart))},[cart]);
 useEffect(()=>{let alive=true;async function check(){if(!session?.user){setAdmin(false);return}const {data,error}=await supabase.from('admin_profiles').select('role').eq('user_id',session.user.id).maybeSingle();if(alive)setAdmin(!error&&Boolean(data))}check();return()=>{alive=false}},[session]);
 const add=(p,q=1)=>setCart(old=>{const x=old.find(i=>i.id===p.id);return x?old.map(i=>i.id===p.id?{...i,quantity:i.quantity+q}:i):[...old,{...p,quantity:q}]});
 const quantity=(id,q)=>setCart(old=>old.map(i=>i.id===id?{...i,quantity:Math.max(1,q)}:i));const remove=id=>setCart(old=>old.filter(i=>i.id!==id));const clear=()=>setCart([]);
 const value=useMemo(()=>({products,categories,banners,settings,loading,catalogueError,cart,session,admin,add,quantity,remove,clear,refresh:load,subtotal:cart.reduce((s,i)=>s+i.price*i.quantity,0)}),[products,categories,banners,settings,loading,catalogueError,cart,session,admin]);
 return <C.Provider value={value}>{children}</C.Provider>;
}