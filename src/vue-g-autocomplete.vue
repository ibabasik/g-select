<template>
    <div class="g-autocomplete" :class="{'disabled':disabled}" :tabindex="disabled?'':1">
        <!--{{changeType}}-->
        <div class="selected-value" v-bind:class="{'dropdown-opened':dropdownOpened}">
            <input type="text" v-model="filter" ref="text" class="text"
                   v-on:keydown="filterKeydown($event)" v-on:blur="lostFocus" :placeholder="placeholder"/>
        </div>


        <div class="disabled-mask" v-if="disabled"></div>
        <div v-if="dropdownOpened" class="dropdown" ref="dropdown" >
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

    var _ = require('lodash');

    export default {
        props:{
            value:[String,Number,Object],
            options: Array,
            textPath: {type:String, default:'name'},
            idPath: {type:String, default:'id'},
            bindId: Boolean,
            placeholder: String,
            customFilter: Function,
            populate: Function,
            populateText:{type:String, default:'populating...'},
            noResultsText: String,
            addClearButton:Boolean,
            maxDropdownHeight:[String,Number],
            disabled:Boolean,
            text: String,

            log:Boolean
        },

        data:function(){
            return{
                rawSelectedValue: null,
                //isComplex: false,
                dropdownOpened: false,
                filter: '',
                focusedIndex: null,
                isPopulating: false,
                changeType: ''
            }
        },

        created:function () {
            var self = this;


            self.resetChangeType = function () {
                self.$nextTick(function (){
                    //_.debounce(function () {
                    if (self.log){
                        console.log('debounced from ' + self.changeType);
                    }

                    self.changeType = '';
                    //},1);
                });
            };

            window.addEventListener('click',function(evt){
                if (!self.$el.contains(evt.srcElement||evt.originalTarget)){
                    self.dropdownOpened=false;
                }
            });
            self.filter = self.text;
            self.setSelectedOptionType();
            if (self.value !== null && self.value !== undefined){
                self.changeType = 'valueChanged.external';
                self.setSelectedOption();
            } else if (self.text){
                self.changeType = 'filter.external';
                self.setFilter();
            }
            self.resetChangeType();
        },

        computed:{
            allOptions:function(){
                return this.options;
            },

            filteredOptions:function(){
                if (!this.filter||!this.allOptions||this.populate) return this.allOptions;
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
                            return el && el[this.textPath].toLowerCase().indexOf(tfilter)!=-1;
                        }.bind(this));
                    } else {
                        return _.filter(this.allOptions,function(el){
                            return JSON.stringify(el).toLowerCase().indexOf(tfilter)!=-1;
                        })
                    }

                }
            },
            isComplex:function(){
                if ((!this.allOptions || !this.allOptions.length) && !this.value){
                    return false;
                }
                if (this.allOptions && this.allOptions.length){
                    return _.isObject(_.find(this.allOptions));
                } else {
                    return _.isObject(this.value);
                }
            },
            selectedValue:function () {
                return this.rawSelectedValue && this.bindId ? this.rawSelectedValue[this.idPath] : this.rawSelectedValue;
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
            },
            selectedOptionText:function () {
                return this.isComplex ? (this.rawSelectedValue && this.rawSelectedValue[this.textPath] || '') : this.rawSelectedValue.toString();
            },
        },
        watch:{
            options:function(){
                var self = this;
                if (!self.filteredOptions || !this.filteredOptionsContainsSelectedValue() || !this.filter || (this.customFilter && !this.customFilter(this.rawSelectedValue,this.filter))) {
                    self.rawSelectedValue = null;
                    self.$emit('input', this.selectedValue, this.rawSelectedValue);
                }
                if (self.isPopulating && self.changeType == 'filter.input'){
                    self.isPopulating = false;
                    self.dropdownOpened = !!(self.filteredOptions && self.filteredOptions.length)
                }

            },
            value:function(){
                var self = this;
                if (self.log){
                    console.log('value changed to '+self.value+', state is '+self.changeType);
                }


                if (!self.changeType){
                    self.changeType = 'valueChanged.external';
                }
                self.setSelectedOption();
                self.resetChangeType();
            },
            bindId:function(){
                this.$emit('input', this.selectedValue, this.rawSelectedValue);
            },
            disabled:function () {
                if (this.disabled){
                    this.dropdownOpened = false;
                }
            },
            filter:function () {
                var self = this;
                if (self.log){
                    console.log('filter changed to '+self.filter+', state is '+self.changeType);
                }

                self.$emit('textchanged',self.filter);
                self.setFilter()
            },
            text: function () {
                var self = this;
                if (self.log){
                    console.log('text changed to '+self.text+', state is '+self.changeType);
                }

                if (!self.changeType){
                    self.changeType = 'filter.external';
                    self.resetChangeType();
                }
                if (self.text!=null && self.text!=undefined){
                    self.rawSelectedValue = null;
                    self.$emit('input', self.selectedValue, self.rawSelectedValue);
                    self.filter = self.text;
                }
            },
            dropdownOpened:function () {
                //this.isSelfSet = false;
            }
        },

        methods:{
            filteredOptionsContainsSelectedValue:function () {
                if (!this.filteredOptions || !this.filteredOptions.length){
                    return false;
                }
                if (this.rawSelectedValue === null || this.rawSelectedValue === undefined){
                    return true;
                }
                if (!this.isComplex){
                    return this.filteredOptions.includes(this.rawSelectedValue);
                } else {
                    var q = this.getIdPathQuery(this.rawSelectedValue[this.idPath]);
                    return _.find(this.filteredOptions, q)!=null;
                }
            },

            setFilter:function () {
                var self = this;
                if (self.populate){
                    if (!self.changeType.indexOf('valueChanged')==0){
                        self.isPopulating = true;
                        self.populate(self.filter);
                        return;
                    }
                } else {
                    if (this.rawSelectedValue !=null && (!self.filteredOptions || !self.filteredOptionsContainsSelectedValue() || !self.filter || (self.customFilter && !self.customFilter(self.rawSelectedValue,self.filter)))) {
                        self.rawSelectedValue = null;
                        self.$emit('input', self.selectedValue, self.rawSelectedValue);
                    }
                    if (self.changeType == 'filter.input'){
                        self.dropdownOpened = !!(self.filteredOptions && self.filteredOptions.length);
                    }
                }
                self.resetChangeType();
            },

            setSelectedOption:function(){
                var self = this;
                var valToSet = self.value===undefined? null : self.value;
                var shouldTriggerChange = false;

                if (_.isArray(valToSet) && valToSet.length){
                    valToSet = valToSet[0];
                }
                if (self.isComplex &&( _.isObject(valToSet) ^ !self.bindId )){
                    if (self.bindId){
                        valToSet = valToSet[self.idPath];
                        if (valToSet === undefined){
                            valToSet = null;
                        }
                    } else {
                        valToSet = ( valToSet && _.find(self.allOptions, self.getIdPathQuery(valToSet))) || null;
                    }
                }
                if (valToSet === null || valToSet === undefined){
                    self.rawSelectedValue = valToSet;
                } else if (self.allOptions && self.allOptions.indexOf(valToSet)!=-1){
                    self.rawSelectedValue = valToSet;
                } else if (self.isComplex || !self.allOptions || !self.allOptions.length){
                    var id = self.bindId ? valToSet: valToSet[self.idPath];
                    self.rawSelectedValue = (self.allOptions && self.allOptions.length) ? _.find(self.options,self.getIdPathQuery(id)) : valToSet;
                } else {
                    self.rawSelectedValue = null;
                }
                shouldTriggerChange = self.selectedValue !== self.value;

                if (shouldTriggerChange){
                    self.$emit('input', self.selectedValue, self.rawSelectedValue);
                }
                if (self.changeType.indexOf('valueChanged')==0){
                    var filterToSet = (self.rawSelectedValue != null)?self.selectedOptionText:'';
                    if (filterToSet != self.filter){
                        self.filter  = filterToSet;
                    }
                }
                self.resetChangeType();
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
                var r = this.rawSelectedValue && this.rawSelectedValue[0];
                if (r !== null || r !== undefined){
                    this.rawSelectedValue = r;
                } else {
                    this.rawSelectedValue = null;
                }
                this.$emit('input', this.selectedValue, this.rawSelectedValue);
            },
            selectOption:function(option){
                var self = this;
                if (option===undefined) return;
                self.rawSelectedValue = option;
                self.changeType = 'valueChanged.click';
                self.filter = self.selectedOptionText;
                self.dropdownOpened = false;
                self.focusedIndex = null;
                self.$emit('input', self.selectedValue, self.rawSelectedValue);
            },

            isSelected:function (option) {
                if (this.rawSelectedValue === null || this.rawSelectedValue === undefined || !this.isComplex){
                    return option === this.rawSelectedValue;
                }
                if (option === null || option === undefined){
                    return false;
                }
                return option[this.idPath] == this.rawSelectedValue[this.idPath];
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
                        if (this.$refs.dropdown && !this.elementIsVisible(this.$refs.dropdown)){
                            this.$refs.dropdown.scrollIntoView();
                        }
                    }.bind(this))
                }
            },
            removeValue:function(value,evt){
                _.pull(this.rawSelectedValue,value);
                this.$emit('input', this.selectedValue, this.rawSelectedValue);
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
            filterKeydown:function (event) {



                var self=this;

                self.changeType='filter.input';

                if (event.code == "Enter"){
                    if (!self.dropdownOpened){
                        self.dropdownOpened = true;
                    } else {
                        if (self.focusedIndex!=null && self.filteredOptions[self.focusedIndex]!==undefined) {
                            self.selectOption(self.filteredOptions[self.focusedIndex]);
                            self.$nextTick(function () {
                                self.dropdownOpened = false;
                            });
                        } else {
                            if (this.rawSelectedValue !== null && this.rawSelectedValue !== undefined){
                                self.changeType='filter.external';
                                this.filter = this.selectedOptionText;
                                self.resetChangeType();
                            }
                            this.dropdownOpened = false;
                        }

                    }

                }
                if (event.code=="ArrowDown"){
                    self.focusItem(1);
                    event.preventDefault();
                }
                if (event.code=="ArrowUp"){
                    self.focusItem(-1);
                    event.preventDefault();
                }

            },
            lostFocus:function () {
                var self = this;
                window.setTimeout(
                    //Vue.nextTick(
                    function () {
                        if (!self.$el.contains(document.activeElement)) {
                            self.dropdownOpened = false;
                            if (self.rawSelectedValue) {
                                self.filter = self.selectedOptionText;
                                self.$nextTick(function () {
                                    self.dropdownOpened = false;
                                });
                            }
                        }
                        //});
                    },100);
            }
        }
    }

</script>
<style lang="sass">
    .g-autocomplete{
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

            input{
                margin-left: 5px;
                margin-right: 5px;
            }

            .text{
                flex-grow: 1;
                border: none;
                outline: none;
            }

            .placeholder{
                color: gray;
                margin: 2px 5px;
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
                    white-space: nowrap;
                    display: flex;
                }

                .single-selected-item{
                    margin: 2px;
                }


                .multiple-selected-item .remove-button{
                    border-left: 1px solid #466782;
                    /*width: 18px;
                    height: 18px;*/
                    margin-right: -3px;
                    margin-left: 2px;
                    cursor: pointer;

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
                    cursor: pointer;
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
