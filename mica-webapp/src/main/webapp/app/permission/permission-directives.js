'use strict';

mica.permission

.directive('permissionsTable', [function () {
  return {
    restrict: 'E',
    scope: {
      permissions: '=',
      accesses: '=',
      openAccess: '=',
      onAdd: '=',
      onLoad: '=',
      onDelete: '=',
      onAccessAdd: '=',
      onAccessLoad: '=',
      onAccessDelete: '='
    },
    templateUrl: 'app/permission/permission-table-template.html',
    controller: 'PermissionsController'
  };
}])

.directive('permissionConfigTable', [function () {
  return {
    restrict: 'E',
    scope: {
      permissions: '=',
      onAdd: '=',
      onDelete: '=',
      onLoad: '=',
      name: '='
    },
    templateUrl: 'app/permission/permission-config-table-template.html',
    controller: 'PermissionsConfigController'
  }
}])

.controller('PermissionsConfigController', ['$rootScope', '$scope', '$uibModal',
  function ($rootScope, $scope, $uibModal) {
    $scope.pagination = {searchText: ''};

    function editPermission(acl) {
      $uibModal.open({
        templateUrl: 'app/permission/permission-config-modal-form.html',
        controller: 'PermissionsConfigModalController',
        resolve: {
          acl: function() {
            return angular.copy(acl);
          },
          onAdd: function() {
            return $scope.onAdd;
          }, name: function() {
            return $scope.name;
          }
        }
      }).result.then(function(result) {
        if (result) {
          $scope.onLoad();
        }
      });
    }

    $scope.addPermission = function() {
      editPermission({role: 'READER', type: 'GROUP'})
    };

    $scope.editPermission = function (acl) {
      editPermission(acl);
    };

    $scope.deletePermission = function(acl) {
      $scope.onDelete(acl);
      $scope.onLoad();
    };

    $scope.onLoad();
  }])

.controller('PermissionsConfigModalController', ['$scope', '$uibModalInstance', '$filter', 'acl', 'onAdd', 'name',
  function ($scope, $uibModalInstance, $filter, acl, onAdd, name) {
    $scope.ROLES = ['READER'];
    $scope.TYPES = [
      {name: 'GROUP', label: $filter('translate')('permission.group')},
      {name: 'USER', label: $filter('translate')('permission.user')}
    ];

    var BLOCKED_NAMES = [
      'mica-user',
      'mica-reviewer',
      'mica-editor',
      'mica-data-access-officer',
      'mica-administrator'
    ];

    $scope.name = {arg0: $filter('translate')(name).toLowerCase()};

    var selectedIndex = acl ?
      $scope.TYPES.findIndex(function(type) {
        return type.name === acl.type;
      }) : -1;

    $scope.selectedType = selectedIndex > -1 ? $scope.TYPES[selectedIndex] : $scope.TYPES[0];
    $scope.editMode = acl && acl.principal;
    $scope.acl= acl;

    $scope.save = function (form) {
      form.principal.$setValidity('required', true);

      if (BLOCKED_NAMES.indexOf(acl.principal) > -1) {
        form.principal.$setValidity('required', false);
      }

      if (form.$valid) {
        $scope.acl.type = $scope.selectedType.name;
        onAdd($scope.acl);
        $uibModalInstance.close(true);
      }

      form.saveAttempted = true;
    };

    $scope.cancel = function () {
      $uibModalInstance.close();
    };
  }])

.controller('PermissionsController', ['$rootScope', '$scope', '$uibModal','NOTIFICATION_EVENTS',
  function ($rootScope, $scope, $uibModal, NOTIFICATION_EVENTS) {
    $scope.pagination = {searchText: ''};

    // draft permissions

    function editPermission(acl) {
      $uibModal.open({
        templateUrl: 'app/permission/permission-modal-form.html',
        controller: 'PermissionsModalController',
        resolve: {
          acl: function() {
            return angular.copy(acl);
          },
          onAdd: function() {
            return $scope.onAdd;
          },
          onLoad: function() {
            return $scope.onLoad;
          }
        }
      }).result.then(function(reload) {
        if (reload) {
          $scope.onLoad();
        }
      });

    }

    $scope.addPermission = function () {
      editPermission({type:'USER', role: 'READER'});
    };

    $scope.editPermission = function (acl) {
      editPermission(acl);
    };

    $scope.deletePermission = function (acl) {
      $scope.principalPermissionToDelete = acl.principal;
      $rootScope.$broadcast(NOTIFICATION_EVENTS.showConfirmDialog,
        {
          titleKey: 'permission.delete-dialog.title',
          messageKey: 'permission.delete-dialog.message',
          messageArgs: [acl.type === 'USER' ? 'user' : 'group', acl.principal]
        }, acl
      );
    };

    $scope.$on(NOTIFICATION_EVENTS.confirmDialogAccepted, function (event, acl) {
      if ($scope.principalPermissionToDelete === acl.principal) {
        delete $scope.principalPermissionToDelete;
        $scope.onDelete(acl).$promise.then($scope.onLoad);
      }
    });

    $scope.onLoad();

    // published permissions (=access)

    function editAccess(acl) {
      $uibModal.open({
        templateUrl: 'app/permission/access-modal-form.html',
        controller: 'AccessesModalController',
        resolve: {
          acl: function() {
            return angular.copy(acl);
          },
          onAdd: function() {
            return $scope.onAccessAdd;
          },
          onLoad: function() {
            return $scope.onAccessLoad;
          }
        }
      }).result.then(function(reload) {
        if (reload) {
          $scope.onAccessLoad();
        }
      });
    }

    $scope.addAccess = function () {
      editAccess({type:'USER', role: 'READER', file: true});
    };

    $scope.deleteAccess = function (acl) {
      $scope.principalAccessToDelete = acl.principal;
      $rootScope.$broadcast(NOTIFICATION_EVENTS.showConfirmDialog,
        {
          titleKey: 'access.delete-dialog.title',
          messageKey: 'access.delete-dialog.message',
          messageArgs: [acl.type === 'USER' ? 'user' : 'group', acl.principal]
        }, acl
      );
    };

    $scope.$on(NOTIFICATION_EVENTS.confirmDialogAccepted, function (event, acl) {
      if ($scope.principalAccessToDelete === acl.principal) {
        delete $scope.principalAccessToDelete;
        $scope.onAccessDelete(acl).$promise.then($scope.onAccessLoad);
      }
    });

    $scope.onAccessLoad();
  }])

.controller('PermissionsModalController', ['$scope',
  '$uibModalInstance',
  '$filter',
  'AlertService',
  'ServerErrorUtils',
  'acl',
  'onAdd',
  function ($scope, $uibModalInstance, $filter, AlertService, ServerErrorUtils, acl, onAdd) {
    $scope.ROLES = ['READER', 'EDITOR', 'REVIEWER'];
    $scope.TYPES = [
      {name: 'USER', label: $filter('translate')('permission.user')},
      {name: 'GROUP', label: $filter('translate')('permission.group')}
    ];

    var selectedIndex = acl ?
      $scope.TYPES.findIndex(function(type) {
        return type.name === acl.type;
      }) : -1;

    $scope.selectedType = selectedIndex > -1 ? $scope.TYPES[selectedIndex] : $scope.TYPES[0];
    $scope.acl = acl ? acl : {type: $scope.selectedType.name, role: 'READER'};
    $scope.editMode = acl && acl.principal;

    $scope.save = function (form) {
      if(form.$valid) {
        $scope.acl.type = $scope.selectedType.name;
        onAdd($scope.acl).$promise.then(function () {
          $uibModalInstance.close(true);
        }, function (response) {
          AlertService.alert({
            id: 'formAlert',
            type: 'danger',
            msg: ServerErrorUtils.buildMessage(response)
          });
        });
      }

      form.saveAttempted = true;
    };

    $scope.cancel = function () {
      $uibModalInstance.close();
    };
  }])

.controller('AccessesModalController', ['$scope',
  '$uibModalInstance',
  '$filter',
  'AlertService',
  'ServerErrorUtils',
  'acl',
  'onAdd',
  function ($scope, $uibModalInstance, $filter, AlertService, ServerErrorUtils, acl, onAdd) {
    $scope.TYPES = [
      {name: 'USER', label: $filter('translate')('permission.user')},
      {name: 'GROUP', label: $filter('translate')('permission.group')}
    ];

    var selectedIndex = acl ?
      $scope.TYPES.findIndex(function(type) {
        return type.name === acl.type;
      }) : -1;

    $scope.selectedType = selectedIndex > -1 ? $scope.TYPES[selectedIndex] : $scope.TYPES[0];
    $scope.acl = acl ? acl : {type: $scope.selectedType.name, role: 'READER'};

    $scope.save = function (form) {
      if(form.$valid) {
        $scope.acl.type = $scope.selectedType.name;
        onAdd($scope.acl).$promise.then(function () {
          $uibModalInstance.close(true);
        }, function (response) {
          AlertService.alert({
            id: 'formAlert',
            type: 'danger',
            msg: ServerErrorUtils.buildMessage(response)
          });
        });
      }

      form.saveAttempted = true;
    };

    $scope.cancel = function () {
      $uibModalInstance.close();
    };
  }]);
