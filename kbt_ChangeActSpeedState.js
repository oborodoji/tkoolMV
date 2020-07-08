//=============================================================================
// kbt_ChangeActSpeedState
// 行動速度を変えるステートを設定するプラグインです。
// Last Updated: 2020.07.08
//
// Copyright (c) 2020 小鳩箱
// Released under the MIT license
// https://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc ver1.00/行動速度を変えるステートを設定するプラグインです。
 * @author 小鳩箱
 * 
 * @param isOverwrite
 * @desc 防御などの先制スキルが対象になった場合、補正をどうするか。
 * @type select
 * 
 * @option 加算
 * @value 1
 * 
 * @option 上書き
 * @value 2
 * 
 * @option 最大値
 * @value 3
 * 
 * @default 1
 *
 * @help
 * キャラクターの速度を変えず、行動速度だけ変更するステートを設定します。
 * 逃走率を変えずに、先制行動または後発行動になるステートです。
 *
 * オプションの「防御などの先制スキルが対象になった場合、補正をどうするか」では、以下の三つから処理を選択してください。
 *
 * 1.加算：補正値を足します。
 *   例えば素早さが100、防御スキル補正が2000、ステート補正が500だった場合、2600で計算します。
 *
 * 2.上書き：ステートの補正値で上書きします。
 *   例えば素早さが100、防御スキル補正が2000、ステート補正が500だった場合、500で計算します。
 *
 * 3.最大値：元々の補正か、ステートの補正か、より大きい方で上書きします。
 *   例えば素早さが100、防御スキル補正が2000、ステート補正が500だった場合は2100で計算しますが、
 *   素早さが100、防御スキル補正が100、ステート補正が500だった場合は500で計算します。
 *   ステートの補正値がマイナスだった場合は、より小さい数値となります。
 *
 * 隊商のステートのメモ欄に、以下のように記載してください。
 * 数値は実数を指定してください。
 *  <ChangeActSpeed:[補正値]>
 *
 * 例1：以下のように設定すると、そのステートにかかっている間、行動速度に+500の補正が入ります。
 *  <ChangeActSpeed:500>
 *
 * 例2：以下のように設定すると、そのステートにかかっている間、行動速度に-500の補正が入ります。
 *  <ChangeActSpeed:-500>
 */

(function() {
  var parameters = PluginManager.parameters('kbt_ChangeActSpeedState');
  var isOverwrite = Number(parameters['isOverwrite']);

  var _Game_Action_prototype_speed = Game_Action.prototype.speed;
  Game_Action.prototype.speed = function() {
	  var speed = _Game_Action_prototype_speed.call(this);

      // 対象者のデータを取得
	  var target;
	  if (this._subjectActorId > 0) {
		  // アクター
		  target = $gameActors.actor(this._subjectActorId);
      } else {
		  // エネミー
		  target = $gameTroop.members()[this._subjectEnemyIndex];
	  }

	  // ステートから速度補正
      target._states.forEach(function(state) {
          if ($dataStates[state].meta['ChangeActSpeed'] != null) {
			  var changeSpeed = Number($dataStates[state].meta['ChangeActSpeed']);
			  if (isOverwrite === 1) {
				  speed += changeSpeed;
			  } else if (isOverwrite === 2) {
				  speed = changeSpeed;
			  } else {
				  if (changeSpeed > 0) {
					  speed = Math.max(speed, changeSpeed);
				  } else {
					  speed = Math.min(speed, changeSpeed);
				  }
			  }
          }
      });

      return speed;
  };

})();
