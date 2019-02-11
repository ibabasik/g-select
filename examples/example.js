import Vue from 'vue';
import gSelect from '../src/index';

Vue.use(gSelect);

var s = new Vue({
	el:'#root',
	data:{
		bindId1:false,
		bindId2:false,
		bindId3:true,
		bindId4:false,
		bindId5:false,
		disabled1:false,
		iChooseSimple:null,
		iChooseObjects:null,
		iChooseTemplate:null,
		iChooseId:5,
		iChooseMultiple:[2,3,4],
		iChooseExternal:null,
		message:'hello world',
		list:[],
		useFilter: false,
		pokemons:
			[
				{id:1, name:'Pikachu',type:'electric'},
				{id:2, name:'Bulbasaur',type:'grass'},
				{id:3, name:'Charmander',type:'fire'},
				{id:4, name:'Squirtle',type:'water'},
				{id:5, name:'Eevee',type:'normal'},
				{id:6, name:'Jigglypuff',type:'fairy'},
				{id:7, name:'Zubat',type:'flying'},
				{id:8, name:'Pidgey',type:'flying'},
				{id:9, name:'Rattata',type:'normal'},
				{id:10, name:'Drowzee',type:'psychic'},
				{id:11, name:'Paras',type:'grass'}
			],
		iChoose: null,
		iChooseValue: null
	},
	mounted(){

	},
	methods:{
		addToList:function () {
			for(var i=0; i<this.pokemons.length; i++){
				this.list.push(this.pokemons[i]);
			}
		},
		setSelected:function(val,obj){
			this.iChoose=val;
			this.iChooseValue = obj;
		},
		pokemonFilter:function(p,filter){
			return {result: p.indexOf(filter)!=-1,order:p.indexOf(filter) };
		},
		getPokemons:function(filter){
			self.lastFilter = filter;
			setTimeout(function(){
				if (self.lastFilter == filter){
					this.filteredPokemons = _.filter(this.pokemons,function(p){
						return !filter || p.name.toLowerCase().indexOf(filter.toLowerCase())!=-1;
					});
				}
			}.bind(this),3000);
		},
		filterByNameAndType:function (pokemon,filter) {
			var r = new RegExp(filter,'gi');
			return pokemon.name.match(r) || pokemon.type.match(r);
		},
		filterByNameAndTypeAndSortByName:function (pokemon,filter) {
			var r = new RegExp(filter, 'gi');
			return {result: pokemon.name.match(r) || pokemon.type.match(r), order: pokemon.name}
		}

	}
});