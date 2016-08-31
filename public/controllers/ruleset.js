// Require config
var config = require('plugins/wazuh/config/config.js');
var app = require('ui/modules').get('app/wazuh', []);

app.controller('rulesController', function ($scope, $route, $q, alertify, sharedProperties, $location, $sce, DataFactory, tabProvider, $mdToast) {
    //Initialisation
    $scope.load = true;

    $scope.rules = [];

    $scope.statusFilter = 'enabled';

    $scope.maxLevel = 15;
    $scope.minLevel = 0;

    var _file;
    var _group;
    var _pci;
    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        if ($scope._rules_blocked) {
            $scope._rules_blocked = false;
        }
    };

    //Functions

    $scope.fileSearchFilter = function (search) {
        if (search) {
            DataFactory.filters.set(objectsArray['/rules'], 'search', search);
        } else {
            DataFactory.filters.unset(objectsArray['/rules'], 'search');
        }
    };

    $scope.rulesApplyFilter = function (filterObj) {
        if (!filterObj) {
            return null;
        }
        if (filterObj.type == 'file') {
            _file = filterObj.value;
            DataFactory.filters.set(objectsArray['/rules'], 'file', filterObj.value);
        } else if (filterObj.type == 'group') {
            _group = filterObj.value;
            DataFactory.filters.set(objectsArray['/rules'], 'group', filterObj.value);
        } else if (filterObj.type == 'pci') {
            _pci = filterObj.value;
            DataFactory.filters.set(objectsArray['/rules'], 'pci', filterObj.value);
        }
    };

    $scope.rulesHasFilter = function (type) {
        if (type == 'file') {
            return _file && _file != null;
        } else if (type == 'group') {
            return _group && _group != null;
        } else if (type == 'pci') {
            return _pci && _pci != null;
        } 
    };

    $scope.rulesUnset = function (type) {
        if (type == 'file') {
            _file = null;
            DataFactory.filters.unset(objectsArray['/rules'], 'file');
        } else if (type == 'group') {
            _group = null;
            DataFactory.filters.unset(objectsArray['/rules'], 'group');
        } else if (type == 'pci') {
            _pci = null;
            DataFactory.filters.unset(objectsArray['/rules'], 'pci');
        }
    };

    $scope.rulesGetFilter = function (type) {
        if (type == 'file') {
            return _file;
        } else if (type == 'group') {
            return _group;
        } else if (type == 'pci') {
            return _pci;
        } 
    };

    $scope.filtersSearch = function (search) {
        var defered = $q.defer();
        var promise = defered.promise;

        var result = [];

        if (!search) {
            defered.reject();
            return promise;
        }

        DataFactory.getAndClean('get', '/rules/files', { 'offset': 0, 'limit': 100, 'search': search })
            .then(function (data) {
                angular.forEach(data.data.items, function (value) {
                    result.push({'type': 'file', 'value': value.name});
                });
                DataFactory.getAndClean('get', '/rules/groups', { 'offset': 0, 'limit': 100, 'search': search })
                    .then(function (data) {
                        angular.forEach(data.data.items, function (value) {
                            result.push({ 'type': 'group', 'value': value });
                        });
                        DataFactory.getAndClean('get', '/rules/pci', { 'offset': 0, 'limit': 100, 'search': search })
                            .then(function (data) {
                                angular.forEach(data.data.items, function (value) {
                                    result.push({ 'type': 'pci', 'value': value });
                                });
                                defered.resolve(result);
                            }, function (data) {
                                printError(data);
                                defered.reject();
                            })
                    }, function (data) {
                        printError(data);
                        defered.reject();
                    })
            }, function (data) {
                printError(data);
                defered.reject();
            })

        return promise;
    };

    $scope.rulesLevelFilter = function () {
        if (!$scope.minLevel || !$scope.maxLevel || $scope.minLevel == null || $scope.maxLevel == null) {
            return null;
        }
        if (0 <= parseInt($scope.minLevel) <= parseInt($scope.maxLevel) <= 15) {
            DataFactory.filters.set(objectsArray['/rules'], 'level', $scope.minLevel+'-'+$scope.maxLevel);
        }
    };

    $scope.rulesStatusFilter = function (status) {
        DataFactory.filters.set(objectsArray['/rules'], 'status', status);
    };

    $scope.rulesObj = {
        //Obj with methods for virtual scrolling
        getItemAtIndex: function (index) {
            if ($scope._rules_blocked) {
                return null;
            }
            var _pos = index - DataFactory.getOffset(objectsArray['/rules']);
            if (DataFactory.filters.flag(objectsArray['/rules'])) {
                $scope._rules_blocked = true;
                DataFactory.scrollTo(objectsArray['/rules'], 50)
                    .then(function (data) {
                        $scope.rules.length = 0;
                        $scope.rules = data.data.items;
                        DataFactory.filters.unflag(objectsArray['/rules']);
                        $scope._rules_blocked = false;
                    }, printError);
            } else if ((_pos > 70) || (_pos < 0)) {
                $scope._rules_blocked = true;
                DataFactory.scrollTo(objectsArray['/rules'], index)
                    .then(function (data) {
                        $scope.rules.length = 0;
                        $scope.rules = data.data.items;
                        $scope._rules_blocked = false;
                    }, printError);
            } else {
                return $scope.rules[_pos];
            }
        },
        getLength: function () {
            return DataFactory.getTotalItems(objectsArray['/rules']);
        },
    };

    var load = function () {
        DataFactory.initialize('get', '/rules', {}, 100, 0)
            .then(function (data) {
                objectsArray['/rules'] = data;
                DataFactory.get(objectsArray['/rules'])
                    .then(function (data) {
                        $scope.rules = data.data.items;
                        DataFactory.filters.register(objectsArray['/rules'], 'search', 'string');
                        DataFactory.filters.register(objectsArray['/rules'], 'file', 'string');
                        DataFactory.filters.register(objectsArray['/rules'], 'group', 'string');
                        DataFactory.filters.register(objectsArray['/rules'], 'pci', 'string');
                        DataFactory.filters.register(objectsArray['/rules'], 'level', 'string');
                        DataFactory.filters.register(objectsArray['/rules'], 'status', 'string');
                        DataFactory.filters.register(objectsArray['/rules'], 'filter-sort', 'string');
                        DataFactory.filters.set(objectsArray['/rules'], 'filter-sort', '-level');
                        $scope.load = false;
                    }, printError);
            }, printError);
    };

    //Load
    load();

    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
    });

});

app.controller('decodersController', function ($scope, $route, $q, alertify, sharedProperties, $location, $sce, DataFactory, tabProvider) {
    //Initialisation
    $scope.load = true;
    $scope.enableFileSearch = true;

    $scope.decoders = [];
    $scope.filesDecoders = [];

    $scope.dfType = 'all';
    $scope.dfFile = '';
    $scope.dfId = '';

    $scope.menuNavItem = 'ruleset';
    $scope.submenuNavItem = 'decoders';

    $scope.decoderType = 'all';

    $scope.pageId = (Math.random().toString(36).substring(3));
    tabProvider.register($scope.pageId);

    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        alertify.delay(10000).closeLogOnClick(true).error(error.html);
    }

    //Tabs
    $scope.setTab = function (tab, group) {
        tabProvider.setTab($scope.pageId, tab, group);
    };

    $scope.isSetTab = function (tab, group) {
        return tabProvider.isSetTab($scope.pageId, tab, group);
    };

    //Functions

    //Decoders - Filters

    $scope.setDecodersFilter = function (type, value) {
        if (type === 'type') {
            if (value !== $scope.dfType) {
                $scope.dfId = '';
                $scope.dfFile = '';
                $scope.dfType = value;
            }
        }

        if (type === 'id') {
            $scope.dfFile = '';
            $scope.dfType = 'all';
            $scope.decoder_search = '';
            if (value === $scope.dfId) {
                $scope.dfId = '';
            } else {
                $scope.dfId = value;
            }
        }

        if (type === 'file') {
            $scope.dfId = '';
            if (value === $scope.dfFile) {
                $scope.dfFile = '';
            } else {
                $scope.dfFile = value;
            }
        }

        _applyDecodersFilters(type);
    };

    $scope.isSetDecodersFilter = function (type, value) {
        if (type === 'type') {
            return $scope.dfType === value;
        } else if (type === 'file') {
            return $scope.dfFile === value;
        } else if (type === 'id') {
            return $scope.dfId === value;
        } else {
            return false;
        }
    };

    $scope.hasDecodersFilter = function (type) {
        if (type === 'type') {
            return $scope.dfType != '';
        } else if (type === 'file') {
            return $scope.dfFile != '';
        } else if (type === 'id') {
            return $scope.dfId != '';
        } else {
            return false;
        }
    };

    var _applyDecodersFilters = function (type) {
        if (type === 'id') {
            var call;
            if ($scope.dfId === '') {
                call = '/decoders';
            } else {
                call = '/decoders/' + $scope.dfId;
            }
            DataFactory.clean(objectsArray['/decoders']);
            DataFactory.initialize('get', call, {}, 10, 0)
                .then(function (data) {
                    objectsArray['/decoders'] = data;
                    DataFactory.get(data).then(function (data) {
                        $scope.decoders = data.data.items;
                    });
                }, printError);
        } else {
            if (type === 'type') {
                var call;
                if ($scope.dfType === 'all') {
                    call = '/decoders';
                    $scope.enableFileSearch = true;
                } else {
                    call = '/decoders/parents';
                    $scope.enableFileSearch = false;
                }
                var body = {};
                if ($scope.decoder_search != '') {
                    body['search'] = $scope.decoder_search;
                }
                DataFactory.clean(objectsArray['/decoders']);
                DataFactory.initialize('get', call, body, 10, 0)
                    .then(function (data) {
                        objectsArray['/decoders'] = data;
                        DataFactory.get(data).then(function (data) {
                            $scope.decoders = data.data.items;
                        });
                    }, printError);
            } else if (type === 'file') {
                if ($scope.dfFile != '') {
                    $scope.objGet('/decoders', 'decoders', {'file': $scope.dfFile});
                } else {
                    $scope.objGet('/decoders', 'decoders', {});
                }
            }
        }
    };

    //Decoders - aux functions

    $scope.formatFile = function (file) {
        return file.split("/").slice(-1)[0];
    };

    $scope.formatTemplate = function (file) {
        return '<span style="width: 200px; display: inline-block; text-align: left;">'+file+'</span>';
    };

    $scope.decoderTooltips = function (key) {
        var tooltip;
        switch (key) {
            case 'prematch':
            case 'regex':
                tooltip = 'OS_Regex type (simple library for regular expressions in C).';
                break;
            case 'program_name':
                tooltip = 'OS_Match type (supports simple string matching and the following special characters).';
                break;
            case 'accumulate':
                tooltip = 'Allow OSSEC to track events over multiple log messages based on a decoded id.';
                break;
            case 'order':
                tooltip = 'Extracted fields by decoder regex.';
                break;
            case 'fts':
                tooltip = 'First time seen';
                break;
            default:
                tooltip = 'Tooltip not found for this field.';
                break;
        }
        return '<div style="width: 250px;">' + tooltip + '</div>';
    };

    $scope.colorRegex = function (regex) {
        regex = regex.toString();
        var colors = ['blue', 'cadetblue', 'chocolate', 'darkgoldenrod', 'darkmagenta', 'darkred', 'darksalmon', 'dodgerblue', 'green',
            'indigo', 'orange', 'purple', 'sienna', 'yellowgreen'];
        var valuesArray = regex.match(/\(((?!<\/span>).)*?\)(?!<\/span>)/gmi);
        var coloredString = regex;
        for (var i = 0; i < valuesArray.length; i++) {
            coloredString = coloredString.replace(/\(((?!<\/span>).)*?\)(?!<\/span>)/mi, '<span style="color: ' + colors[i] + ' ">' + valuesArray[i] + '</span>');
        }
        return $sce.trustAsHtml(coloredString);
    };

    $scope.colorOrder = function (order) {
        order = order.toString();
        var colors = ['blue', 'cadetblue', 'chocolate', 'darkgoldenrod', 'darkmagenta', 'darkred', 'darksalmon', 'dodgerblue', 'green',
            'indigo', 'orange', 'purple', 'sienna', 'yellowgreen'];
        var valuesArray = order.split(',');
        var coloredString = order;
        for (var i = 0; i < valuesArray.length; i++) {
            coloredString = coloredString.replace(valuesArray[i], '<span style="color: ' + colors[i] + ' ">' + valuesArray[i] + '</span>');
        }
        return $sce.trustAsHtml(coloredString);
    };

        //Obj functions

    $scope.objHasNext = function (objName) {
        return DataFactory.hasNext(objectsArray[objName]);
    };
    $scope.objNext = function (objName, containerName) {
        DataFactory.next(objectsArray[objName])
            .then(function (data) {
                _applyContainer(data, containerName);
            }, printError);
    };

    $scope.objHasPrev = function (objName) {
        return DataFactory.hasPrev(objectsArray[objName]);
    };
    $scope.objPrev = function (objName, containerName) {
        DataFactory.prev(objectsArray[objName])
            .then(function (data) {
                _applyContainer(data, containerName);
            }, printError);
    };

    $scope.objGet = function (objName, containerName, body) {
        //Search body modification
        var searchField = _getSearchField(containerName);
        if (!body) {
            var tmpBody = DataFactory.getBody(objectsArray[objName]);
            if (searchField !== tmpBody['search']) {
                tmpBody['search'] = searchField;
                body = tmpBody;
            }
        } else if (searchField !== body['search']) {
            body['search'] = searchField;
        }
        if (body['search'] === '') {
            body['search'] = undefined;
        }

        if (!body) {
            DataFactory.get(objectsArray[objName])
                .then(function (data) {
                    _applyContainer(data, containerName);
                }, printError);
        } else {
            DataFactory.get(objectsArray[objName], body)
                .then(function (data) {
                    _applyContainer(data, containerName);
                }, printError);
        }
    };

    var _getSearchField = function (containerName) {
        switch (containerName) {
            case 'decoders':
                return $scope.decoder_search;
            case 'filesDecoders':
                return $scope.searchFilesDecoders;
            default:
                return '';
        }
    };

    var _applyContainer = function (data, containerName) {
        switch(containerName) {
            case 'decoders':
                $scope.decoders.length = 0;
                $scope.decoders = data.data.items;
                break;
            case 'filesDecoders':
                $scope.filesDecoders.length = 0;
                $scope.filesDecoders = data.data.items;
                break;
            default:
                break;
        }
    };

    //Load functions

    var load_decoders_files = function () {
        DataFactory.initialize('get', '/decoders/files', {}, 15, 0)
            .then(function (data) {
                objectsArray['/decoders/files'] = data;
                DataFactory.get(data).then(function (data) {
                    $scope.filesDecoders = data.data.items;
                    $scope.load = false;
                });
            }, printError);
    };

    var load_decoders = function () {
        DataFactory.initialize('get', '/decoders', {}, 10, 0)
            .then(function (data) {
                objectsArray['/decoders'] = data;
                DataFactory.get(data).then(function (data) {
                    $scope.decoders = data.data.items;
                    load_decoders_files();
                });
            }, printError);
    };

    var load = function () {
        load_decoders();
    };

    //Load
    load();

    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
        tabProvider.clean($scope.pageId);
    });
});


app.controller('updateRulesetController', function ($scope, $route, $q, alertify, sharedProperties, $location, $sce, DataFactory, tabProvider, $mdDialog, $mdToast) {
    //Initialisation
    $scope.load = true;

    $scope.backups = [];

    $scope.updateType = 'b';
    $scope.updateForce = false;

    $scope.menuNavItem = 'ruleset';
    $scope.submenuNavItem = 'update';

    $scope.pageId = (Math.random().toString(36).substring(3));
    tabProvider.register($scope.pageId);

    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    }

    //Tabs
    $scope.setTab = function (tab, group) {
        tabProvider.setTab($scope.pageId, tab, group);
    };

    $scope.isSetTab = function (tab, group) {
        return tabProvider.isSetTab($scope.pageId, tab, group);
    };

    //Functions

    //Backups

    $scope.updateRuleset = function (ev) {
        if (!$scope.updateType) {
            $mdToast.show({
                template: '<md-toast>Select an update type</md-toast>',
                position: 'bottom left',
                hideDelay: 5000,
            });
        }
        if ($scope.updateForce) {
            var template = 'Are you sure you want to update the ruleset? The ruleset will be overwritten, except local_rules and local_decoders file. OSSEC manager is going to be restarted. Before the update, backup of the ruleset will be done.';
        }
        else {
            var template = 'Are you sure you want to update the ruleset? The ruleset will be overwritten, except local_rules and local_decoders file. If any rule included in ossec.conf is updated, OSSEC manager will be restarted. Before the update, backup of the ruleset will be done.';
        }
        var confirm = $mdDialog.confirm()
            .title('Update ruleset')
            .textContent(template)
            .targetEvent(ev)
            .ok('Update')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function () {
            if ($scope.updateForce) {
                if ($scope.updateType == 'r') {
                    var path = '/manager/update-ruleset?force=yes&type=rules';
                } else if ($scope.updateType == 'c') {
                    var path = '/manager/update-ruleset?force=yes&type=rootchecks';
                } else {
                    var path = '/manager/update-ruleset?force=yes';
                }
            } else {
                if ($scope.updateType == 'r') {
                    var path = '/manager/update-ruleset?type=rules';
                } else if ($scope.updateType == 'c') {
                    var path = '/manager/update-ruleset?type=rootchecks';
                } else {
                    var path = '/manager/update-ruleset';
                }
            }
            DataFactory.getAndClean('put', path, {})
                .then(function (data) {
                    var alert = data.data.msg + '. ';
                    if (data.data.need_restart === 'yes' && (data.data.restarted === 'no' || data.data.restart_status === 'fail')) {
                        alert += "The manager needs to be manually restarted.";
                    } else if (data.data.restarted === 'yes') {
                        alert += "The manager has been restarted. ";
                    }
                    if (data.data.manual_steps !== 'no') {
                        alert += "The following manual steps are required: " + data.data.manual_steps_detail;
                    }
                    $mdToast.show({
                        template: '<md-toast>' + alert + '</md-toast>',
                        position: 'bottom left',
                        hideDelay: 5000,
                    });
                    $scope.load_backups();
                }, printError);
        });
    };

    $scope.restoreBackup = function (ev) {
        var template = 'Are you sure you want to restore this backup? This action can not be undone.';
        var confirm = $mdDialog.confirm()
            .title('Restore backup')
            .textContent(template)
            .targetEvent(ev)
            .ok('Restore')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function () {
            DataFactory.getAndClean('put', '/manager/update-ruleset/backups/' + $scope.selectedBackup, {})
                .then(function (data) {
                    var alert;
                    if (data.data.msg === 'Backup successfully') {
                        alert = 'Backup successfuly restored. ';
                    }
                    if (data.data.need_restart === 'yes' && (data.data.restarted === 'no' || data.data.restart_status === 'fail')) {
                        alert += "The manager needs to be manually restarted.";
                    } else if (data.data.restarted === 'yes') {
                        alert += "The manager has been restarted";
                    }
                    if (data.data.manual_steps !== 'no') {
                        alert += "The following manual steps are required: " + data.data.manual_steps_detail;
                    }
                    $mdToast.show({
                        template: '<md-toast>' + alert + '</md-toast>',
                        position: 'bottom left',
                        hideDelay: 5000,
                    });
                }, printError);
        });
    };

    //Load functions

    $scope.load_backups = function () {
        var defered = $q.defer();
        var promise = defered.promise;

        DataFactory.getAndClean('get', '/manager/update-ruleset/backups', {})
            .then(function (data) {
                defered.resolve();
                $scope.backups.length = 0;
                $scope.backups = data.data;
            }, function (error) {
                printError(error);
                defered.reject();
            });

        return promise;
    };

    var load = function () {
        $scope.load = false;
    };

    //Load
    load();

    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
        tabProvider.clean($scope.pageId);
    });

});
