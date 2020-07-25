//=============================================================================
// kbt_RandomOrganize
// キャラクターをランダムに選んでパーティを編成するプラグインです。
// Last Updated: 2019.01.05
//
// Copyright (c) 2019 小鳩箱
// Released under the MIT license
// https://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc ver1.00/キャラクターをランダムに選んでパーティを編成するプラグインです。
 * @author 小鳩箱
 * 
 * @param MaxPartyMember
 * @type number
 * @desc パーティに編成可能な最大人数を設定します。
 * @default 8
 * 
 * @param StartId
 * @type number
 * @desc アクターID：1の加入条件となる、スイッチのIDを設定します。
 * @default 101
 * 
 * @param ExclusionActorList
 * @type actor[]
 * @desc 加入スイッチがONになっていても選出されないアクターを設定します。
 * @default []
 *
 * @help
 * ランダム編成ができるようになるプラグインです
 *
 * プラグインコマンド
 * 
 * RandomOrganize (編成する人数)
 *  指定された人数で、編成可能なアクターをランダムに選出してパーティを入れ替えます。
 *  プラグインで設定されている、編成可能人数以上の数値または0以下の数値を入れた場合はコマンドが無視されます。
 *  また、その時点で編成可能なアクター数より大きな数字を指定する、などで無限ループが起きた場合は、
 *  編成可能キャラクターがいなくなったものとしてそこで抽選を終了します。
 *
 * ランダムに4人編成をする場合
 * RandomOrganize 4
 * とプラグインコマンドに入力してください。
 */

(function() {
    var parameters = PluginManager.parameters('kbt_RandomOrganize');
    var MaxPartyMember = Number(parameters['MaxPartyMember']);
    var StartId = Number(parameters['StartId']);
    if (parameters['ExclusionActorList'] !== undefined) {
        var ExclusionActorList = JSON.parse(parameters['ExclusionActorList']);
    } else {
        var ExclusionActorList = [];
    }

    //=============================================================================
    // プラグインコマンド
    //=============================================================================
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'RandomOrganize') {
            var num = Number(args[0]);
            if (!isNaN(num) && num > 0 && num <= MaxPartyMember) {
                randomOrganize(num);
            }
        }
    };

    function randomOrganize(max_organize_member) {
        // パーティメンバーをランダムに選出
        var max_member = $dataActors.length;
        var organized_member = 0;
        var organized_list = [];
        var loop_count = 0;
        while (organized_member < max_organize_member) {
           // ループ回数をカウントし、10万回を越えた時は無限ループに入ったものとして処理を中断
           loop_count++;
           if (loop_count > 100000) {
               break;
           }
           var target = Math.floor(Math.random() * (max_member - 1)) + 1;
           if ($gameSwitches.value(target + StartId - 1)) {
               if (ExclusionActorList.indexOf(String(target)) === -1 && organized_list.indexOf(target) === -1) {
                   organized_list.push(target);
                   organized_member ++;
               }
           }
        }

        // パーティ内のアクターを外す
        var menber_num = $gameParty._actors.length;
        for(let i = 0; i < menber_num; i++){
            // 先頭を外すと後ろのメンバーが前にずれるので、常に0番目を外す処理を行う。
            $gameParty.removeActor($gameParty._actors[0]);
        }

        // 選出アクターをパーティに追加
        for(let i = 0; i < organized_list.length; i++){
            $gameParty.addActor(organized_list[i]);
        }
    };
})();
