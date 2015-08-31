/*
 * Copyright (c) 2015, salesforce.com, inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided
 * that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions and the
 * following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and
 * the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or
 * promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

var React = require('react-native');
var {
    AppRegistry,
    StyleSheet,
    NavigatorIOS
} = React;

var smartstore = require('./react.force.smartstore.js');
var smartsync = require('./react.force.smartsync.js');
var SearchScreen = require('./SearchScreen.js');
var syncInFlight = false;
var syncDownId;

var App = React.createClass({
    componentDidMount: function() {
        var that = this;
        smartstore.registerSoup(false,
                                "contacts", 
                                [ {path:"Id", type:"string"}, 
                                  {path:"FirstName", type:"full_text"}, 
                                  {path:"LastName", type:"full_text"}, 
                                  {path:"__local__", type:"string"} ],
                                function() {
                                    that.syncDown((sync) => syncDownId=sync._soupEntryId);
                                });
    },

    syncDown: function(callback) {
        if (syncInFlight) {
            console.log("Not starting syncDown - sync already in fligtht");
            return;
        }
        
        console.log("Starting syncDown");
        syncInFlight = true;
        var fieldlist = ["Id", "FirstName", "LastName", "Title", "Email", "MobilePhone","Department","HomePhone", "LastModifiedDate"];
        var target = {type:"soql", query:"SELECT " + fieldlist.join(",") + " FROM Contact WHERE Title like '%Engineer%' LIMIT 10000"};
        smartsync.syncDown(false,
                           target,
                           "contacts",
                           {mergeMode:smartsync.MERGE_MODE.LEAVE_IF_CHANGED},
                           function(sync) {syncInFlight = false; if (callback) callback(sync);},
                           function(error) {syncInFlight = false;}
                          );

    },
    
    reSync: function(callback) {
        if (syncInFlight) {
            console.log("Not starting reSync - sync already in fligtht");
            return;
        }

        console.log("Starting reSync");
        syncInFlight = true;
        smartsync.reSync(false,
                         syncDownId,
                         function(sync) {syncInFlight = false; if (callback) callback(sync);},
                         function(error) {syncInFlight = false;}
                        );
    },

    syncUp: function(callback) {
        if (syncInFlight) {
            console.log("Not starting syncUp - sync already in fligtht");
            return;
        }

        console.log("Starting syncUp");
        syncInFlight = true;
        smartsync.syncUp(false,
                         {},
                         "contacts",
                         {mergeMode:smartsync.MERGE_MODE.LEAVE_IF_CHANGED},
                         function(sync) {syncInFlight = false; if (callback) callback(sync);},
                         function(error) {syncInFlight = false;}
                        );
    },
    
    render: function() {
        var that = this;
        return (
            <NavigatorIOS
                style={styles.container}
                barTintColor='red'
                titleTextColor='white'
                tintColor='white'
                initialRoute={{
                    title: 'Contacts',
                    component: SearchScreen,
                    rightButtonIcon: require('image!sync'),
                    onRightButtonPress: () => that.syncUp(() => that.reSync())
                }}
            />
        );
    }
});

var styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    }
});

React.AppRegistry.registerComponent('SmartSyncExplorerReactNative', () => App);
