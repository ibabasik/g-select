# Select компонента для Vue2

## Установка


### Из репозитория:
```
    npm install --save-dev git+https://github.com/ibabasik/g-select.git
```

### Подключение

### Глобально:
```js
    Vue.component('g-select',require('vue-g-select'));
```

### Внутри конкретного компонента:
```js
module.exports = {
    ...
    components: {
        'g-select': require('vue-g-select')
    },
    ...
}
```

### Использование

```js
    new Vue({
        el:'#root',
        data:{
            chosenId:1,
            pokemons:[
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
            ]
        }
    ...
    })
```


```html
<g-select :options="pokemons" :bind-id="true" id-path="id" v-model="chosenId"></g-select>
```

Больше примеров в example.html

### Параметры

| Имя | Тип | Значение по умолчанию |	Описание |
| ---- |:----:|:-------:|:----------- |
| options | Array | null | Массив опций селекта. Может быть из объектов или простых типов |
| value |	Object/String/Number	| null |	Значение, которое будет выбрано изначально. Так же, можно менять выбранное значение селекта, меняя значение переданного параметра |
| multiple |	Boolean |	false |	Можно ли выбирать сразу много значений. Если да, то выбранное значение будет массивом |
| textPath | String |	'name' |	Имя поля в объекте опции, которое будет отображаться в списке |
| bindId | Boolean |	false |	Выбирать ли из выбранной опции только идентификатор или брать весь объект |
| idPath |	String | 'id' |	Имя поля идентификатора в объекте опции |
| placeholder |	String |	null	| Что отображать, пока значение не выбрано  |
| hasFilter |	Boolean |	false	| Нужно ли поле поиска по опциям |
| noResultsText |	String |	null |	Текст, отображаемый, если список опций пуст (в т.ч. из-за фильтра) |
| customFilter |	Function |	null |	Функция кастомного фильтра. Должна принимать опцию и строку фильтра и возвращать true, если опция попадает под фильтр и false если нет. Так же функция может возвращать объект из 2 полей: 'result', содержащий true/false, как в первом случае и 'order', указывающий порядок данного элемента в конечном списке |
| addNullValue |	Boolean |	false |	Добавить ли в список пустую опцию, имеющую выбранное значение null |
| nullValueText |	String |	'Not selected' |	Что отображать в списке на месте пустой опции |
| addClearButton |	Boolean |	false |	Отображать ли кнопку 'отчистить значение' при режиме выбора одиночного значения |
| populate |	Function |	null |	Функция для асинхронной подгрузки опций. Вызывается при изменении фильтра. Принимает параметр - значение фильтра. По получению опций должна переприсвоить массив options |
| populateText | String | 'populating...' | Текст, отображаемый, пока идет асинхронный запрос (пока не будет переприсвоен массив options) |
| maxDropdownHeight |	String/Number |	null |	Максимальная высота выпадающего списка |
| disabled |	Boolean |	false |	Заблокирован ли элемент |
| autoClose |	Boolean |	false |	Закрывать ли список по выбору элемента для множественного выбора |

### События

#### input

Параметры события:
- выбранное значение
- выбранная опция

Параметры отличаются, если задан параметр bindId: в этом случае выбранное значение - это только идентификатор, а выбранная опция - весь объект


### Использование v-model

Для двусторонней привязки выбранного значения вместо пары :value и @input можно использовать директиву v-model.




### Шаблоны

#### item-template
Шаблон, как отображать выбранный элемент и элементы списка.
Передаваемые параметры шаблона:
*item* - объект-элемент из массива options

```html
<g-select ...>
    <template slot="item-template" scope="props">
        <b>{{ props.item.name }}</b> ({{props.item.type}})
    </template>
</g-select>
```

