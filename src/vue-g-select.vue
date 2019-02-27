<template>
    <div class="g-select" :class="{'disabled':disabled}" tabindex="1" @keydown="handleKeyDown($event)" @blur="lostFocus">
        <div v-on:click="toggleDropdown($event)" class="selected-value" v-bind:class="{'dropdown-opened':dropdownOpened}">
            <span class="placeholder" v-if="placeholder && (!rawSelectedValue || (multiple && !rawSelectedValue.length)) ">{{placeholder}}</span>
            <div class="selected-value-container">
                <div v-if="rawSelectedValue !== null && !multiple">
                    <div class="single-selected-item">
                        <slot name="item-template" :item="rawSelectedValue" >
                            {{isComplex&&textPath&&rawSelectedValue?rawSelectedValue[textPath]:rawSelectedValue}}
                        </slot>
                    </div>
                </div>
                <template v-if="multiple">
                    <div class="multiple-selected-item" v-for="value in rawSelectedValue">
                        <div class="multiple-selected-value">
                            <slot name="item-template" :item="value">
                                {{isComplex&&textPath&&value?value[textPath]:value}}
                            </slot>
                        </div>

                        <div class="remove-button" v-on:click="removeValue(value,$event)">
                            <svg viewbox="0 0 18 18" class="icon">
                                <path class="close-x" d="M 5,5 L 13,13 M 5,13 L 13,5" />
                            </svg>
                        </div>
                    </div>
                </template>
            </div>

            <div class="clear-button" v-on:click="selectOption(null)"
                 v-if="!multiple && addClearButton && rawSelectedValue">
                <svg viewbox="0 0 18 18" class="icon">
                    <path class="close-x" d="M 5,5 L 13,13 M 5,13 L 13,5" />
                </svg>
            </div>

            <div class="dropdown-arrow">
                <svg viewbox="0 0 18 18" class="icon">
                    <path class="arrow-v" d="M 5,11 L 9,7 L 13,11" v-if="dropdownOpened"/>
                    <path class="arrow-v" d="M 5,7 L 9,11 L 13,7" v-else/>
                </svg>
            </div>
        </div>

        <div class="disabled-mask" v-if="disabled"></div>
        <div v-if="dropdownOpened" class="dropdown" ref="dropdown" >
            <div class="filter-container">
                <input v-if="hasFilter" ref="filter" type="text" v-model="filter"
                       v-on:keydown.down.stop="focusItem(1)" v-on:keydown.up.stop="focusItem(-1)"
                       v-on:keydown.enter.stop="selectOption(filteredOptions[focusedIndex])">
                    <!--v-on:blur="lostFocus"-->
                </input>
                <div class="populating" v-if="populate"><span v-if="isPopulating">{{populateText}}</span></div>
            </div>
            <div class="options-container" ref="options" :style="actualMaxDropdownHeight?{'max-height':actualMaxDropdownHeight}:''">
                <div v-for="(option,index) in filteredOptions"
                     v-on:click="selectOption(option)" class="option"
                     v-bind:class="{'selected-option':isSelected(option), 'focused-option':focusedIndex == index}" >

                    <slot name="item-template" :item="option" v-if="option!==null">
                        {{isComplex&&textPath&&option?option[textPath]:option}}
                    </slot>
                    <div v-else class="null-option">
                        {{nullValueText}}
                    </div>
                </div>
                <div v-if="!filteredOptions || !filteredOptions.length" class="no-results">
                    {{noResultsText}}
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    //var Vue = require('vue');

    var _ = require('lodash');

    export default {
        props:{
            value:[String,Number,Object,Array],
            //currentValue: [String,Number,Object,Array],
            options: Array,
            multiple: Boolean,
            textPath: {type:String, default:'name'},
            idPath: {type:String, default:'id'},
            bindId: Boolean,
            placeholder: String,
            hasFilter: Boolean,
            customFilter: Function,
            populate: Function,
            populateText:{type:String, default:'populating...'},
            noResultsText: String,
            addClearButton:Boolean,
            addNullValue:Boolean,
            nullValueText:{type:String, default:'Not selected'},
            maxDropdownHeight:[String,Number],
            disabled:Boolean,
            autoClose:Boolean
        },

        data:function(){
            return{
                rawSelectedValue: null,
                //isComplex: false,
                dropdownOpened: false,
                filter: '',
                focusedIndex: null,
                isPopulating: false
            }
        },

        created:function () {
            window.addEventListener('click', this.windowClickListener);
            console.log('created');
            this.filter = this.text;
            this.setSelectedOptionType();
            this.setSelectedOption(true);

        },

        destroyed: function(){
        	window.removeEventListener('click', this.windowClickListener);
        },
        mounted:function () {
            console.log('mounted');
        },

        computed:{
            allOptions:function(){
                if (!this.multiple && this.addNullValue && this.options && this.options.indexOf(null)==-1){
                    return [null].concat(this.options);
                } else {
                    return this.options;
                }
            },

            filteredOptions:function(){
                if (!this.filter||!this.allOptions||(this.populate&&!this.customFilter)) return this.allOptions;
                var tfilter = this.filter.toLowerCase();

                if (this.customFilter){
                    var res = _(this.allOptions).map(function(el){
                        return {
                            filtered:this.customFilter(el,tfilter),
                            item:el
                        }
                    }.bind(this))
                        .filter(function(el){
                            if (el.filtered && el.filtered.order!==undefined && el.filtered.result!==undefined){
                                return el.filtered.result;
                            } else {
                                return el.filtered;
                            }
                        })
                        .sortBy(function(el){
                            return (el.filtered.order!==undefined&&el.filtered.order!=null)?el.filtered.order:1;
                        })
                        .map('item')
                        .value();
                    return res;
                } else {
                    if (this.isComplex && this.textPath){
                        return _.filter(this.allOptions,function(el){
                            return el && (el[this.textPath]).toLowerCase().indexOf(tfilter)!=-1;
                        }.bind(this));
                    } else {
                        return _.filter(this.allOptions,function(el){
                            return JSON.stringify(el).toLowerCase().indexOf(tfilter)!=-1;
                        })
                    }

                }
            },
            isComplex:function(){
                if (!this.allOptions || !this.allOptions.length){
                    return false;
                }
                return _.isObject(_.find(this.allOptions));
            },
            selectedValue:function () {
                if (this.multiple && this.isComplex ){
                    return this.rawSelectedValue && this.bindId ? _.map(this.rawSelectedValue,function(v){ return v[this.idPath]}.bind(this)) : this.rawSelectedValue;
                } else {
                    return this.rawSelectedValue && this.bindId ? this.rawSelectedValue[this.idPath] : this.rawSelectedValue;
                }
            },
            actualMaxDropdownHeight:function () {
                if (!this.maxDropdownHeight){
                    return this.maxDropdownHeight;
                }
                if (_.isNumber(this.maxDropdownHeight)){
                    return this.maxDropdownHeight+'px';
                } else {
                    return this.maxDropdownHeight;
                }
            }
        },
        watch:{
            multiple:function(newVal,oldVal){
                this.setSelectedOptionType();
            },
            options:function(nv, ov){
                this.isPopulating = false;
                this.setSelectedOption();
            },
            value:function(){
                this.setSelectedOption();
            },
            filter:function(){
                if (!this.dropdownOpened) return;
                if (this.populate){
                    this.isPopulating = true;
                    this.populate(this.filter);
                }
            },
            bindId:function(){
                this.$emit('input', this.selectedValue, this.rawSelectedValue);
            },
            disabled:function () {
                if (this.disabled){
                    this.dropdownOpened = false;
                }
            }
        },

        methods:{
            setSelectedOption:function(init){
	            if (!this.options || !this.options.length){
		            return;
	            }

                var valToSet = this.value===undefined? null : this.value;
                var shouldTriggerChange = false;

                if (!this.allOptions || !this.allOptions.length){
                    if (this.multiple){
                        valToSet = [];
                    } else {
                        valToSet = null;
                    }
                }
                if (this.multiple){
                    if (this.arraysAreEqual(this.selectedValue,this.value)){
                        return;
                    }
                    if (valToSet === null || valToSet === undefined){
                        valToSet = [];
                    } else if (_.isArray(valToSet) === false){
                        valToSet=[valToSet]
                    }
                    var newVal=[];
                    _.forEach(valToSet,function (value) {
                        if(value === null || value === undefined){
                            return;
                        }
                        if (this.isComplex && (_.isObject(value) ^ !this.bindId)){
                            if (this.bindId){
                                value = value[this.idPath];
                            } else {
                                value = _.find(this.allOptions, this.getIdPathQuery(value));
                            }
                        }
                        if (this.allOptions.indexOf(value) !== -1){
                            newVal.push(value);
                        } else if (this.isComplex){
                            var id = this.bindId? value: value[this.idPath];
                            var f = _.find(this.options,this.getIdPathQuery(id));
                            if (f){
                                newVal.push(f);
                            } else {
	                            //selectedValueNotFound = true;
                            }
                        }
                    }.bind(this));
                    this.rawSelectedValue = newVal;
                    shouldTriggerChange = true;
                } else {
                    if (_.isArray(valToSet) && valToSet.length){
                        valToSet = valToSet[0];
                    }
                    if (this.isComplex &&( _.isObject(valToSet) ^ !this.bindId )){
                        if (this.bindId){
                            valToSet = valToSet[this.idPath];
                            if (valToSet === undefined){
                                valToSet = null;
                            }
                        } else {
                            valToSet = ( valToSet && _.find(this.allOptions, this.getIdPathQuery(valToSet))) || null;
                        }
                    }
                    if (valToSet === null || valToSet === undefined){
                        this.rawSelectedValue = valToSet;
                    } else if (this.allOptions.indexOf(valToSet) !== -1){
                        this.rawSelectedValue = valToSet;
                    } else if (this.isComplex){
                        var id = this.bindId ? valToSet: valToSet[this.idPath];
                        this.rawSelectedValue = _.find(this.options,this.getIdPathQuery(id));
                    } else {
                        this.rawSelectedValue = null;
                    }
                    shouldTriggerChange = init || this.selectedValue !== this.value;
                }

                if (shouldTriggerChange){
                    this.$emit('input', this.selectedValue, this.rawSelectedValue);
                }
            },

            arraysAreEqual:function (arr1,arr2) {
                if(!arr1||!arr2 || _.isArray(arr1)==false || _.isArray(arr2)==false){
                    return false;
                }
                if (arr1==arr2){
                    return true;
                }
                var indexes=[];
                return arr1.length == arr2.length && _.every(arr1,function (el) {
                        var i = arr2.indexOf(el);
                        if (i==-1 || indexes.includes(i)){
                            return false;
                        } else {
                            indexes.push(i);
                            return true;
                        }
                    });
            },

            setSelectedOptionType:function(){
            	if (!this.options || !this.options.length){
            		return;
                }
                if (this.multiple){
                    var oldVal = this.rawSelectedValue;
                    if (_.isArray(oldVal)){
                        return;
                    }
                    this.rawSelectedValue=[];
                    if (oldVal !== null && oldVal !== undefined){
                        this.rawSelectedValue.push(oldVal);
                    }
                } else {
                    var r = this.rawSelectedValue && this.rawSelectedValue[0];
                    if (r !== null || r !== undefined){
                        this.rawSelectedValue = r;
                    } else {
                        this.rawSelectedValue = null;
                    }
                }
                this.$emit('input', this.selectedValue, this.rawSelectedValue);
            },
            selectOption:function(option){
                if (option===undefined) return;
                if (this.multiple){
                	var idx = this.rawSelectedValue.indexOf(option);
                    if (idx === -1){
                        this.rawSelectedValue.push(option);
                    } else {
                        this.rawSelectedValue.splice(idx, 1);
                    }
                } else {
                    this.rawSelectedValue = option;
                }
                if (!this.populate){
                    this.filter = '';
                }
                if (!this.multiple || this.autoClose){
                    this.dropdownOpened = false;
                }
                this.focusedIndex = null;
                this.$emit('input', this.selectedValue, this.rawSelectedValue);
            },

            isSelected:function (option) {
                return this.multiple?
                this.rawSelectedValue && this.rawSelectedValue.indexOf(option)!=-1 :
                this.rawSelectedValue == option;
            },

            elementIsVisible:function (element) {
                if (!element || element.offsetWidth === 0 || element.offsetHeight === 0) return false;
                var height = document.documentElement.clientHeight,
                    rects = element.getClientRects(),
                    on_top = function(r) {
                        var x = (r.left + r.right)/2, y = (r.top + r.bottom)/2;
                        return element.contains(document.elementFromPoint(x, y));
                    };
                for (var i = 0, l = rects.length; i < l; i++) {
                    var r = rects[i];
                    var in_viewport = r.top > 0 && r.top <= height && r.bottom > 0 && r.bottom <= height;
                    if (in_viewport && on_top(r)) return true;
                }
                return false;
            },

            toggleDropdown:function(evt){
                this.dropdownOpened = !this.dropdownOpened;
                if (this.dropdownOpened){
                    this.$nextTick(function(){
                        if(this.hasFilter && this.$refs.filter){
                            this.filterFocused = true;
                            this.$refs.filter.focus();
                        }
                        if (this.$refs.dropdown && !this.elementIsVisible(this.$refs.dropdown)){
                            this.$refs.dropdown.scrollIntoView();
                        }
                    }.bind(this))
                }
            },
            removeValue:function(value,evt){
                var i = this.rawSelectedValue.indexOf(value);
                if (i!=-1){
                    this.rawSelectedValue.splice(i,1);
                    this.$emit('input', this.selectedValue, this.rawSelectedValue);
                }
            },
            focusItem:function(offs){
                this.focusedIndex = this.focusedIndex != null ?
                    (this.focusedIndex + this.filteredOptions.length+offs) % this.filteredOptions.length:
                    ( offs > 0 ? 0 : this.filteredOptions.length-1 );
                this.$nextTick(function(){

                    if (!this.elementIsVisible(this.$refs.dropdown)){
                        this.$refs.dropdown.scrollIntoView();
                    }

                    var el = this.$el.querySelectorAll('.focused-option');
                    if (el.length && !this.elementIsVisible(el[0])){
                        var selected = el[0];
                        var selectedRect = selected.getBoundingClientRect();
                        var parentRect = this.$refs.options.getBoundingClientRect();
                        if (parentRect.top > selectedRect.top) {
                            this.$refs.options.scrollTop = selected.offsetTop;
                        } else {
                            this.$refs.options.scrollTop = (selected.offsetTop + selectedRect.height) - parentRect.height;
                        }
                    }
                }.bind(this));
            },
            getIdPathQuery:function(value){
                if (!this.idPath){
                    return null;
                } else {
                    var res = {};
                    res[this.idPath] = value;
                    return res;
                }
            },
            handleKeyDown:function (event) {
                if (event.code === 'Space' && event.srcElement === this.$refs.filter){
                    return;
                }
                if (!this.dropdownOpened && event.code !== 'Tab'){
                    this.toggleDropdown();
                } else if (event.code === "Space" || event.code === "Enter"){
                    if (this.focusedIndex != null && this.filteredOptions[this.focusedIndex]!==undefined){
                        this.selectOption(this.filteredOptions[this.focusedIndex]);
                    } else {
                        this.dropdownOpened = false;
                    }
                }
                if (event.code === "ArrowDown"){
                    this.focusItem(1);
                    event.preventDefault();
                }
                if (event.code === "ArrowUp"){
                    this.focusItem(-1);
                    event.preventDefault();
                }
                if (event.code === "Space"){
                    event.preventDefault();
                }
            },
            lostFocus:function () {
                if (!this.filterFocused){
                    this.$nextTick(function () {
                        if (this.focusedIndex != null && this.filteredOptions[this.focusedIndex]!==undefined){
                            this.selectOption(this.filteredOptions[this.focusedIndex]);
                        }
                        this.dropdownOpened = false;
                    });

                }
                this.filterFocused = false;
            },
            windowClickListener(evt) {
	            if (!this.$el.contains(evt.srcElement||evt.originalTarget)){
		            this.dropdownOpened=false;
	            }
            }
        }
    }

</script>
<style lang="sass" type="text/scss">
.g-select{
    position:relative;

    .selected-value,.disabled-mask{
        border-radius: 2px;
    }

    .selected-value{
        min-height: 18px;
        border: 1px solid #b9b9b9;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        cursor: pointer;
        background:white;
        color:black;
        min-width:200px;

        .placeholder{
            color: gray;
            margin: 2px 5px;
            align-items: center;
            justify-content: center;
            display: flex;
            padding: 0 10px;
        }

        .selected-value-container{
            flex-grow: 1;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            align-items:center;

            .multiple-selected-item{
                border: 1px solid #466782;
                background: #cdecfb;
                padding: 0 3px;
                border-radius: 3px;
                margin: 2px;
                margin-left: 5px;
                margin-right: 5px;
                white-space: nowrap;
                display: flex;
                flex-direction: row;
                align-items: center;
            }

            .single-selected-item{
                margin: 2px;
                margin-left: 5px;
                margin-right: 5px;
            }


            .multiple-selected-item .remove-button{
                border-left: 1px solid #466782;
                /*width: 18px;
                height: 18px;*/
                margin-right: -3px;
                margin-left: 2px;
                cursor: pointer;
                display: flex;
                flex-direction: row;
                align-items: center;
                align-self: stretch;

                .close-x{
                    stroke: #466782;
                    fill: transparent;
                    stroke-linecap: round;
                    stroke-width: 2;
                }
            }
        }

        .dropdown-arrow{
            border-left:1px solid #b9b9b9;
            flex-shrink:0;
        }

        .dropdown-arrow, .clear-button{
            display: flex;
            align-items: center;
        }

    }

    svg.icon{
        width: 18px;
        height: 18px;
    }

    .remove-button:hover{
        background: #e5f3ff;
    }



    .selected-value path {
        fill: transparent;
        stroke-linecap: round;
        stroke-width: 2;
    }

    .selected-value .clear-button path{
        stroke: gray;
    }

    .selected-value .dropdown-arrow path{
        stroke: black;
    }

    .selected-value.dropdown-opened{
        border-bottom-right-radius: 0;
        border-bottom-left-radius: 0;
    }


    .dropdown{
        position: absolute;
        background: white;
        left: 0;
        right: 0;
        border: 1px solid #b9b9b9;
        border-top: none;
        border-radius: 0 0 2px 2px;
        z-index:3;

        .options-container{
            max-height: 200px;
            overflow-y: auto;
            position: relative;
        
            .selected-option.focused-option{
                background: #577184;
            }
            
            .focused-option, .focused-option:hover{
                background: #c0e3ef
            }
            
            .option{
                padding: 5px;
                position: relative;
            }
            
            .option:hover{
                background: #f0f8ff
            }
            
            .selected-option, .selected-option:hover{
                background: #91d3f3;
            }
        }

        .filter-container{
            padding: 2px;
            display: flex;
            align-items: stretch;
            flex-direction: column;
        }

        .populating{
            font-size: 12px;
            color: #b9b9b9;
            margin-top: 2px;
            margin-left: 2px;
            min-height: 15px;
        }

        .no-results{
            margin: 5px;
        }

        .null-option{
            color:gray;
        }
    }

    .disabled-mask{
        background: rgba(255, 255, 255, 0.5);
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 2px;
    }
}
.g-select.disabled{
    pointer-events: none;
}
</style>