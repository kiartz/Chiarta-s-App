
const LC={load(){try{return JSON.parse(localStorage.getItem('lc-v4'))||{unit:'cm',gridSizeCm:10,container:{name:'Furgone L3H2',lengthCm:330,widthCm:175,heightCm:250},
catalog:[{id:'m-eur',name:'Europallet',lengthCm:120,widthCm:80,heightCm:14,weightKg:25,color:'#60A5FA'},
{id:'m-fly6040',name:'Flycase 60x40',lengthCm:60,widthCm:40,heightCm:50,weightKg:30,color:'#F59E0B'}],placed:[],boxes3d:[],nextId:1};}catch(e){return null}},
save(s){localStorage.setItem('lc-v4',JSON.stringify(s));},reset(){localStorage.removeItem('lc-v4');}};
const round=(x,d=2)=>Math.round(x*(10**d))/(10**d);const cmToIn=cm=>cm/2.54;const inToCm=i=>i*2.54;
