Jesm.Core.Galeria={
	ativo:false,
	paused:true,
	
	cfg:{
		loadingGif:'img/loading.gif',
		loadingTitle:'Carregando...',
		intervaloSlide:10,
		intervaloTroca:.5,
		tempoAbrir:.25,
		autoAndar:true,
		imgMargin:60,
		limitesProporcao:[.05, 10]
	},
	galerias:{},
	html:{},
	guardaEvs:[],
	func:{}, // propriedade para guardar valores usados internamente pelo obj
	
	
	addLinks:function(arr, g){
		if(Jesm.isElemento(arr))
			arr=[arr];
		if(!g)
			g='default';
		var gal=this.galerias[g]||this.criarGal(g);
		for(var x=0, len=arr.length;x<len;this.galerias[g].addItem(arr[x++]));
	},
	
	criarGal:function(str){
		var JG=this,
		ret={
			sit:0,
			lista:[],
			addItem:function(a){
				var index=this.lista.length;
				Jesm.addEvento(a, 'click', function(e){	
					e.preventDefault();
					JG.abrir(this, index);					
				}, this);
				this.lista.push(this.novoItem(a));
			},
			novoItem:function(a){
				return {
					el:a,
					callback:function(fun){
						if(this.img)
							fun.call(this.img);
						else{
							this.img=Jesm.loadImg(this.el.href, function(){
								fun.call(this);
							});
						}
						return this;
					},
					cancelLoad:function(){
						if(this.img&&!this.img.complete)
							this.img=this.img.onload=null;
					}
				};
			}
		};
		
		return this.galerias[str]=ret;
	},
	
	abrir:function(gal, index){
		if(!gal)
			gal=this.galerias['default'];
		if(!index)
			index=0;
		this.func.galeriaAtual=gal;
		this.ativar(true);
		
		this.html.img.elemento.src=this.cfg.loadingGif;
		this.guardaEvs.push(Jesm.addEvento(document.body, 'keydown', function(e){
			// e.preventDefault();?
			this.lerTeclado(e.which);
		}, this, true));
		
		this.html.div.go(this.cfg.tempoAbrir, [1]);
		this.updatePropsSizes().trocarSlide(index);
	},
	
	fechar:function(){
		var THIS=this;
		this.pausar();
		this.html.move.go(this.cfg.tempoAbrir, [this.tela[0]/2, this.tela[1]/2, 0, 0]);
		setTimeout(function(){
			THIS.html.div.go(THIS.cfg.tempoAbrir, [0], function(){			
				THIS.ativar(false);
			})
		}, 150);
		for(var len=this.guardaEvs.length;len--;Jesm.delEvento(this.guardaEvs.pop()));
	},
	
	ativar:function(bol){
		this.ativo=bol;
		if(bol)
			this.func.scrollCoord=Jesm.Cross.pageOffset();
		pega(document.documentElement).classList[bol?'add':'remove']('jesm_galeria_ativo');
		for(var str=['Left', 'Top'], x=2;x--;document.body['scroll'+str[x]]=bol?this.func.scrollCoord[x]:0);
		if(!bol){
			var t=this.func.scrollCoord;
			window.scroll(t[0], t[1]);
		}
	},
	
	andar:function(num){
		var g=this.func.galeriaAtual;
		this.trocarSlide((g.sit+g.lista.length+(num||1))%g.lista.length);
	},
	
	trocarSlide:function(index){
		this.func.galeriaAtual.sit=index;
		var THIS=this, a=this.func.galeriaAtual.lista[index];
		this.timer.zerar();
		
		this.mostrarImg(this.func.loadImg).setTitle(this.cfg.loadingTitle);
		if(this.linkAtual)
			this.linkAtual.cancelLoad();
		this.linkAtual=a.callback(function(){
			THIS.mostrarImg(this, function(){
				THIS.timer.continuar();
			}).setTitle(a.el.title);
		});		
	},
	
	mostrarImg:function(img, depois){
		var THIS=this, itvl=this.cfg.intervaloTroca, animMove=this.html.move, animImg=this.html.img;
		this.enableChangeState();
		
		this.func.imgAtual=img;
		var dim=[img.width, img.height], offs=[], largs=[];
		this.updateTela().setProporcao(this.getFitProporcao(dim), false, true);
		
		for(var x=2;x--;){
			largs[x]=dim[x]*this.func.proporcao;
			offs[x]=(this.tela[x]-largs[x])/2;
		}
		
		animMove.go(itvl, [offs[0], offs[1], largs[0], largs[1]], function(){			
			THIS.disableChangeState();
			if(depois)
				depois();
		});
		animImg.go(itvl/2, [0], function(){
			this.elemento.src=img.src;
			this.go(itvl/2, [1]);
		});
		
		return this;
	},
	setTitle:function(str){
		var htm=this.html;
		htm.titleBar.innerHTML=htm.img.elemento.title=str;
		return this;
	},
	
	enableChangeState:function(){
		Jesm.Core.drag.drop();
		this.html.imgDrag.ativo=this.html.proporcaoDrag.ativo=false;
		this.changeState=true;
	},	
	disableChangeState:function(){		
		this.html.imgDrag.ativo=this.html.proporcaoDrag.ativo=true;
		this.changeState=false;
	},
	
	getFitProporcao:function(arr){
		var quo=[], tela=this.tela, peq=2;
		for(var x=2;x--;){
			quo[x]=(this.tela[x]-this.cfg.imgMargin*2)/arr[x];
			if(quo[x]>=1)
				peq--;
		}
		return peq?Math.min(quo[0], quo[1]):1;
	},
	setProporcao:function(num, img, barra){
		var lim=this.cfg.limitesProporcao;
		if(num<lim[0])
			num=lim[0];
		else if(num>lim[1])
			num=lim[1];
			
		this.func.proporcao=num;
		if(img){
			this.updateImgSize();
		}
		if(barra){
			var m=this.func.proporcao<1, s=this.func.propsSizes, metPai=s.parentX/2,
			left=m?0:metPai, minimo=m?lim[0]:1, maximo=m?1:lim[1];
			left+=(metPai*(this.func.proporcao-minimo)/(maximo-minimo))-s.childHalfX;
			this.html.arrastaProporcao.style.left=left.toFixed(2)+'px';
		}
	},
	updateImgSize:function(){
		if(this.changeState)
			return;
			
		var pos=[], size=[], dim=['width', 'height'], moveEl=this.html.move.elemento, cli=Jesm.Cross.client(moveEl);
		
		for(var len=2;len--;){
			var d=dim[len];
			size[len]=Math.round(this.func.proporcao*this.func.imgAtual[d]);
			pos[len]=Jesm.Cross.getStyle(moveEl, this.html.imgDrag.cssRule[len], 1)+((Jesm.Cross.getStyle(moveEl, d, 1)-size[len])/2);
			moveEl.style[d]=size[len]+'px';
			moveEl.style[this.html.imgDrag.cssRule[len]]=pos[len].toFixed(2)+'px';
		}
		//this.html.move.go(.05, [pos[0], pos[1], size[0], size[1]]);
	},
	
	// ajustar proporcao atraves da roda de rolagem
	zoom:function(e){		
		var num=Jesm.Cross.wheelDelta(e)<0?1:-1, p=this.func.proporcao, lim=this.cfg.limitesProporcao,
		img=this.func.imgAtual, larg=img.width;
		num=this.func.proporcao*Math.pow(1.1, num);
		this.setProporcao(num, true, true);
	},
	// ajustar proporcao atraves de barra html
	corrigirPropPos:function(pos, drag){
		var ret=pos[0], s=this.func.propsSizes, subs=s.parentX-s.childHalfX;
		if(ret<-s.childHalfX)
			ret=-s.childHalfX;
		else if(ret>subs)
			ret=subs;
			
		var prop=2*(ret+s.childHalfX)/s.parentX, lim=this.cfg.limitesProporcao;
		prop=prop<1?prop*(1-lim[0])+lim[0]:(prop-1)*(lim[1]-1)+1;		
		this.setProporcao(prop, true, false);
		
		return [ret, 0];
	},
	
	timer:{
		tempoPassou:0,
		
		start:function(){
			if(!this.parent.changeState){
				this.lastFrame=+new Date;
				Jesm.Core.animator.addTarefa(this.avancar, this);
			}
			return this;
		},
		stop:function(){
			if(!this.parent.changeState){
				Jesm.Core.animator.delTarefaByObj(this);
				this.lastFrame=0;
			}
			return this;
		},
		continuar:function(){
			if(!this.parent.paused)
				this.start();
		},
		zerar:function(){
			this.stop();
			this.tempoPassou=0;	
			this.parent.html.barraProgresso.go(.2, [0]);
		},
		avancar:function(){
			var n=+new Date, dur=this.parent.cfg.intervaloSlide*1000;
			this.tempoPassou+=n-this.lastFrame;
			this.lastFrame=n;
			this.parent.html.barraProgresso.elemento.style.width=(this.tempoPassou/dur*100).toFixed(2)+'%';
			if(this.tempoPassou>=dur){
				this.parent.andar();
				return true;
			}				
		},		
		changePauseButton:function(b){
			var but=this.parent.html.playButton;
			but.classList[b?'add':'remove']('paused');
			but.innerHTML=b?'&#9658':'&#9616;&#9616; ';
		}
	},
	interromper:function(){		
		this.pausar();
	},
	
	toggle:function(){
		if(!this.cfg.autoAndar)
			return;
		if(this.paused)
			this.continuar();
		else
			this.pausar();
	},
	continuar:function(){
		if(!this.cfg.autoAndar)
			return;
		this.paused=false;
		this.timer.start().changePauseButton(this.paused);
	},
	pausar:function(){
		if(!this.cfg.autoAndar)
			return;
		this.paused=true;
		this.timer.stop().changePauseButton(this.paused);
	},
	
	updateTela:function(){
		this.tela=Jesm.Cross.inner();
		return this;
	},
	updatePropsSizes:function(){
		this.func.propsSizes={
			parentX:Jesm.Cross.offsetSize(this.html.barraProporcao)[0],
			childHalfX:Jesm.Cross.offsetSize(this.html.arrastaProporcao)[0]/2
		};
		return this;
	},
	lerTeclado:function(tecla){
		switch(tecla){
			case 27:
				this.fechar();
			break;
			case 32:
				this.toggle();
			break;
			case 37: case 38:
				this.andar(-1);
			break;
			case 39: case 40:
				this.andar(1);
			break;
		}
	},
	
	iniciar:function(){
		this.timer.parent=this;
		this.paused=!this.cfg.autoAndar;
		
		var frag=document.createDocumentFragment(), htm=this.html;
		htm.div=new Jesm.Anima(Jesm.el('div', 'id=jesm_galeria', frag), 'opacity');	
		if(this.cfg.autoAndar)
			htm.div.elemento.classList.add('auto_andar');
		htm.move=new Jesm.Anima(Jesm.el('div', 'id=jesm_galeria_move', htm.div.elemento), 'left;top;width;height');
		htm.img=new Jesm.Anima(Jesm.el('img', null, htm.move.elemento), 'opacity');
		htm.img.elemento.ondragstart=function(){
			return false;
		};
		
		htm.fechar=Jesm.el('a', 'href=javascript:void(0);id=jesm_galeria_fechar;title=Fechar', htm.div.elemento, '&#9747;');
		
		htm.funcHolder=Jesm.el('div', 'id=jesm_galeria_func_holder', htm.div.elemento);
		htm.titleBar=Jesm.el('div', 'id=jesm_galeria_title_bar', htm.funcHolder);
		
		htm.ctrlHolder=Jesm.el('div', 'id=jesm_galeria_ctrl_holder', htm.div.elemento);
		htm.playButton=Jesm.el('a', 'href=javascript:void(0);id=jesm_galeria_play_button;title=Iniciar/Pausar', htm.ctrlHolder);		
		htm.setaEsq=Jesm.el('a', 'href=javascript:void(0);id=jesm_galeria_seta_esq;title=Anterior', htm.ctrlHolder, '&#8592;');
		htm.setaDir=Jesm.el('a', 'href=javascript:void(0);id=jesm_galeria_seta_dir;title=Próxima', htm.ctrlHolder, '&#8594;');
		
		htm.barraProgresso=new Jesm.Anima(Jesm.el('div', null, Jesm.el('div', 'id=jesm_galeria_barra_progresso', htm.div.elemento)), 'width', 'linear');
		
		htm.barraProporcao=Jesm.el('div', null, Jesm.el('div', 'id=jesm_galeria_barra_proporcao', htm.div.elemento));
		htm.arrastaProporcao=Jesm.el('div', 'id=jesm_galeria_arrasta_proporcao', htm.barraProporcao);
		htm.proporcaoDrag=new Jesm.Drag(htm.arrastaProporcao, null, htm.barraProporcao);
		htm.proporcaoDrag.validar=function(p){
			return Jesm.Core.Galeria.corrigirPropPos(p, this); 
		};
		
		function fechar(){
			this.fechar();
		};
		function notPropagate(e){
			e.stopPropagation();
		};
		
		Jesm.addEvento(htm.div.elemento, 'click', fechar, this);
		Jesm.addEvento(htm.fechar, 'click', fechar, this);
		for(var p=[htm.move.elemento, htm.barraProporcao.parentNode, htm.funcHolder, htm.ctrlHolder], len=p.length;len--;Jesm.addEvento(p[len], 'click', notPropagate));
		
		Jesm.addEvento(htm.div.elemento, 'wheel', function(e){
			this.zoom(e);
			e.preventDefault();
		}, this);
		
		Jesm.addEvento(htm.playButton, 'click', function(){
			this.toggle();
		}, this);
		Jesm.addEvento(htm.setaEsq, 'click', function(){
			this.andar(-1);
		}, this);
		Jesm.addEvento(htm.setaDir, 'click', function(){
			this.andar(1);
		}, this);
		
		htm.imgDrag=new Jesm.Drag(htm.move.elemento, null, htm.div.elemento);
		this.func.loadImg=new Image(32, 32);
		Jesm.loadImg(this.cfg.loadingGif, function(){
			Jesm.Core.Galeria.func.loadImg=this;
		});
		
		this.timer.changePauseButton(this.paused);
		
		document.body.appendChild(frag);
		return this;
	}
};