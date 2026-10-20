
"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {formatVND} from "../lib/constants";
export default function ProductCard({p}){
 const [liked,setLiked]=useState(false);
 useEffect(()=>{const a=JSON.parse(localStorage.getItem("mira_wishlist")||"[]");setLiked(a.includes(p.id))},[p.id]);
 function toggle(){let a=JSON.parse(localStorage.getItem("mira_wishlist")||"[]");a=a.includes(p.id)?a.filter(x=>x!==p.id):[...a,p.id];localStorage.setItem("mira_wishlist",JSON.stringify(a));setLiked(!liked);dispatchEvent(new Event("mira-update"))}
 function add(){let a=JSON.parse(localStorage.getItem("mira_cart")||"[]"),i=a.findIndex(x=>x.id===p.id);if(i>=0)a[i].qty++;else a.push({...p,qty:1});localStorage.setItem("mira_cart",JSON.stringify(a));dispatchEvent(new Event("mira-update"));alert("Đã thêm vào giỏ hàng");}
 return <article className="card"><div className="cardImg"><Link href={"/product/"+p.id}><img src={p.image} alt={p.name}/></Link>{p.badge&&<span className="badge">{p.badge}</span>}<button className="heart" onClick={toggle}>{liked?"♥":"♡"}</button></div><div className="cardBody"><div className="category">{p.category}</div><h3><Link href={"/product/"+p.id}>{p.name}</Link></h3><div className="stars">★★★★★ <span className="muted"> {p.rating}</span></div><p><span className="price">{formatVND(p.price)}</span><span className="old">{formatVND(p.oldPrice)}</span></p><button className="btn" style={{width:"100%"}} onClick={add}>Thêm vào giỏ</button></div></article>
}
