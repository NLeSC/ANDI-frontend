'use strict';
//test data goes here
/**
 * @ngdoc function
 * @name andiApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the andiApp
 */

/*
  @name andiApp.controller:PanelCtrl
  @description : change tab code made in this controller
*/
app.controller("PanelController",function(){
  this.tab=1; // Default Active Tab
  /*Tab Click Event*/
  this.selectTab=function(setTab){
    this.tab=setTab;
  };
  /*show the clicked tab panel*/
  this.isSelected=function(checkTab){
    return this.tab === checkTab;
  };
  /*previous button click event to backward one tab*/
  this.previous =function(){
    return this.tab= this.tab-1;
  };
  /*next button click event to move on tab forward*/
  this.next=function(){
    return this.tab = this.tab+1;
  };
});