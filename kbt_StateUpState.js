//=============================================================================
// kbt_StateUpState
// ステート付与率をアップさせるステートの設定、運要素の除外を行うプラグインです。
// Last Updated: 2019.01.05
//
// Copyright (c) 2019 小鳩箱
// Released under the MIT license
// https://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc ver1.00/ステート付与率をアップさせるステートの設定、運要素の除外を行うプラグインです。
 * @author 小鳩箱
 * 
 * @param DebuffUpStateList
 * @type state[]
 * @desc デバフ付与率アップのステートを指定します。
 * @default ["53"]
 * 
 * @param DebuffUpBonus
 * @type number
 * @desc デバフ付与率の上昇値をパーセントで指定します。
 * @default 5
 * 
 * @param BuffUpStateList
 * @type state[]
 * @desc バフ付与率アップのステートを指定します。
 * @default ["53"]
 * 
 * @param BuffUpBonus
 * @type number
 * @desc バフ付与率の上昇値をパーセントで指定します。
 * @default 5
 * 
 * @help
 * このプラグインによって運の値は常に1が返される状態に上書きされます。
 * これは運のパラメータを回復力に改名し、ダメージ計算式内で使うための処理となっています。
 * 
 * バフ・デバフの付与率・回避率の計算は運のパラメータではなく、
 * デバフ付与率アップステート、バフ付与率アップステートを設定して上下させます。
 */

(function() {
  var parameters = PluginManager.parameters('kbt_StateUpState');
  if (parameters['DebuffUpStateList'] !== undefined) {
    var DebuffUpStateList = JSON.parse(parameters['DebuffUpStateList']);
  } else {
    var DebuffUpStateList = [];
  }
  var DebuffUpBonus = Number(parameters['DebuffUpBonus']);
  if (parameters['BuffUpStateList'] !== undefined) {
    var BuffUpStateList = JSON.parse(parameters['BuffUpStateList']);
  } else {
    var BuffUpStateList = [];
  }
  var BuffUpBonus = Number(parameters['BuffUpBonus']);
  
  // デバフ付与率アップステートの計算
  var debuffEffectRate = function(subject) {
    var stateList = DebuffUpStateList;
    var value = 1.0;
    stateList.forEach(function(stateId) {
      if (this.isStateAffected(Number(stateId))) {
        value += (DebuffUpBonus / 100);
      } else {
      }
    }, subject);
    return value;
  };
  
  // バフ付与率アップステートの計算
  var buffEffectRate = function(subject) {
    var stateList = BuffUpStateList;
    var value = 1.0;
    stateList.forEach(function(stateId) {
      if (this.isStateAffected(Number(stateId))) {
        value += (BuffUpBonus / 100);
      }
    }, subject);
    return value;
  };


  // 運のステータスを取得する処理を、常に1を返すように上書き
  Game_Action.prototype.lukEffectRate = function(target) {
    return 1.0;
  };

  // 攻撃ステートの付与判定
  Game_Action.prototype.itemEffectAddAttackState = function(target, effect) {
    this.subject().attackStates().forEach(function(stateId) {
      var chance = effect.value1;
      chance *= target.stateRate(stateId);
      chance *= this.subject().attackStatesRate(stateId);
      chance *= buffEffectRate(this.subject());
      if (Math.random() < chance) {
        target.addState(stateId);
        this.makeSuccess(target);
      }
    }.bind(this), target);
  };

  // 通常ステートの付与判定
  Game_Action.prototype.itemEffectAddNormalState = function(target, effect) {
    var chance = effect.value1;
    if (!this.isCertainHit()) {
      chance *= target.stateRate(effect.dataId);
      chance *= debuffEffectRate(this.subject());
    }
    if (Math.random() < chance) {
      target.addState(effect.dataId);
      this.makeSuccess(target);
    }
  };

  // デバフステートの付与判定
  Game_Action.prototype.itemEffectAddDebuff = function(target, effect) {
    var chance = target.debuffRate(effect.dataId) * debuffEffectRate(this.subject());
    if (Math.random() < chance) {
      target.addDebuff(effect.dataId, effect.value1);
	  this.makeSuccess(target);
    }
  };
})();
