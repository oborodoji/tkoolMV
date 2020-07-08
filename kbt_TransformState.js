//=============================================================================
// kbt_TransformState
// 特定のアクターID、エネミーID、タグがあると、別のステートに変わるステートを設定するプラグインです。
// Last Updated: 2020.07.08
//
// Copyright (c) 2020 小鳩箱
// Released under the MIT license
// https://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc ver1.00/IDかタグによって別のステートに変わるステートを設定するプラグインです。
 * @author 小鳩箱
 * 
 * @help
 * 特定のアクターID、エネミーID、タグがあると、別のステートに変わるステートを設定するプラグインです。
 * ステートのメモ欄に、以下のように記述してください。
 * 複数の設定をした場合（アクターIDとエネミーIDを両方記載する、など）は、どちらの対象にも有効になります。
 *
 * 同じ対象が別々の条件を満たす場合は、タグよりもIDが優先されます。
 * アクターID=1のキャラクターメモ欄に<TransTag>と記載し、
 * ステートのメモ欄に<TransStateActor:1,5><TransStateTag:TransTag,10>と記載した場合は、ステートID=5に変換されます。
 *
 *  <TransStateActor:[アクターID],[ステートID]>
 *  <TransStateEnemy:[エネミーID],[ステートID]>
 *  <TransStateTag:[タグ],[ステートID]>
 *
 * 例1：アクターID=1の味方にかかった時だけ、ステートID=5に変わるステート
 *  <TransStateActor:1,5>
 *
 * 例2：エネミーID=1の敵にかかった時だけ、ステートID=5に変わるステート
 *  <TransStateEnemy:1,5>
 *
 * 例3：メモ欄に「<TransTag>」が記載されている相手にかかった時だけ、ステートID=10に変わるステート
 *  <TransStateTag:TransTag,10>
 */

(function() {
    'use strict';

    var _Game_Battler_prototype_addState = Game_Battler.prototype.addState;

    Game_Battler.prototype.addState = function(stateId) {
		var state = $dataStates[stateId];

		// タグの指定を確認
		var tagData = $dataStates[stateId].meta['TransStateTag'];
		if ( tagData != null ) {
			var list = tagData.split(',', 2);
			if (this._actorId != null && $dataActors[this._actorId].meta[list[0]] != null) {
				stateId = list[1]
			}
			if (this._enemyId != null && $dataEnemies[this._enemyId].meta[list[0]] != null) {
				stateId = list[1]
			}
		}

		// アクターIDの指定を確認
		var actorData = $dataStates[stateId].meta['TransStateActor'];
		if ( actorData != null ) {
			var list = actorData.split(',', 2);
			if (this._actorId != null && this._actorId == list[0]) {
				stateId = list[1]
			}
		}

		// エネミーIDの指定を確認
		var enemyData = $dataStates[stateId].meta['TransStateEnemy'];
		if ( enemyData != null ) {
			var list = enemyData.split(',', 2);
			if (this._enemyId != null && this._enemyId == list[0]) {
				stateId = list[1]
			}
		}

        _Game_Battler_prototype_addState.call(this, stateId);
    };

})();