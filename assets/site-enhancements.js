(function(){
  'use strict';
  var telegram='https://t.me/docelucro';
  function el(tag, attrs, html){var node=document.createElement(tag);Object.keys(attrs||{}).forEach(function(k){node.setAttribute(k,attrs[k]);});if(html!==undefined)node.innerHTML=html;return node;}
  function addCommunity(){
    if(document.querySelector('.dg-community')) return;
    var banner=el('section',{class:'dg-community','aria-labelledby':'dg-community-title'},'<div class="dg-community-inner"><div class="dg-community-copy"><p class="dg-community-kicker">Doce &amp; Lucro</p><h2 id="dg-community-title">Gestão simples para quem transforma ingredientes em renda.</h2><p>Entre na comunidade e receba ideias práticas para vender melhor, organizar a produção e cuidar do seu lucro.</p></div><a class="dg-community-cta" href="'+telegram+'" target="_blank" rel="noopener">Entrar na comunidade <span aria-hidden="true">→</span></a></div>');
    var footer=document.querySelector('footer.dg-footer');
    if(footer) footer.parentNode.insertBefore(banner,footer); else document.body.appendChild(banner);
  }
  function addFooter(){
    if(document.querySelector('footer.dg-footer')) return;
    var footer=el('footer',{class:'dg-footer'},'<div class="dg-footer-inner"><div><a class="dg-footer-brand" href="/"><span>DG</span> DoceGestor</a><p>Gestão, receitas e recursos para confeiteiras.</p></div><nav class="dg-footer-links" aria-label="Links do rodapé"><a href="/">Início</a><a href="/blog/">Blog</a><a href="/receitas/">Receitas</a><a href="/ebooks/">E-books</a><a href="'+telegram+'" target="_blank" rel="noopener">Comunidade Telegram</a></nav></div><div class="dg-footer-note">DoceGestor · Transforme sua produção em uma rotina mais organizada e lucrativa.</div>');
    document.body.appendChild(footer);
  }
  function addHero(){
    var path=window.location.pathname.replace(/\/+$/,'')||'/';
    // O blog já possui um hero próprio renderizado pelo bundle React; não criar um segundo.
    if(path!=='/receitas' && path!=='/ebooks') return;
    if(document.querySelector('.dg-editorial-hero')) return;
    var data={
      '/receitas':{kicker:'Receitas para testar e vender',title:'Receitas que cabem na rotina e valorizam seu trabalho.',text:'Prepare, padronize e encontre novas ideias para o seu cardápio — com receitas organizadas para quem transforma sabor em renda.',pills:['Doces e bolos','Passo a passo claro','Ideias para encomendas']},
      '/ebooks':{kicker:'Biblioteca DoceGestor',title:'Conhecimento gostoso para abrir novas possibilidades.',text:'Encontre e-books em PDF para estudar, se inspirar e ampliar seu repertório de doces, bolos e sobremesas.',pills:['PDF para baixar','Leitura no celular','Conteúdo para confeitaria']}
    }[path];
    var hero=el('section',{class:'dg-editorial-hero'},'<div class="dg-hero-inner"><div class="dg-hero-kicker">'+data.kicker+'</div><h1>'+data.title+'</h1><p>'+data.text+'</p><div class="dg-hero-pills">'+data.pills.map(function(x){return '<span>'+x+'</span>';}).join('')+'</div></div>');
    var nav=document.querySelector('#site-navigation,header');
    var target=document.querySelector('#automated-articles,main');
    if(target){target.parentNode.insertBefore(hero,target);}
    else if(nav) nav.parentNode.insertBefore(hero,nav.nextSibling); else document.body.insertBefore(hero,document.body.firstChild);
  }
  function init(){
    document.body.classList.add('dg-enhanced');
    addHero();
    addCommunity();
    addFooter();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
