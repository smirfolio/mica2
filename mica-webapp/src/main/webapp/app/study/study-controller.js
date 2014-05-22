'use strict';

mica.study
  .controller('StudyListController', ['$scope', 'DraftStudySummariesResource', 'DraftStudyResource',

    function ($scope, DraftStudySummariesResource, DraftStudyResource) {

      $scope.studies = DraftStudySummariesResource.query();

      $scope.deleteStudy = function (id) {
        //TODO ask confirmation
        DraftStudyResource.delete({id: id},
          function () {
            $scope.studies = DraftStudySummariesResource.query();
          });
      };

    }])
  .controller('StudyViewController', ['$rootScope', '$scope', '$routeParams', '$log', '$locale', '$location', 'DraftStudySummaryResource', 'DraftStudyResource', 'DraftStudyPublicationResource', 'MicaConfigResource',

    function ($rootScope, $scope, $routeParams, $log, $locale, $location, DraftStudySummaryResource, DraftStudyResource, DraftStudyPublicationResource, MicaConfigResource) {

      MicaConfigResource.get(function (micaConfig) {
        $scope.tabs = [];
        micaConfig.languages.forEach(function (lang) {
          $scope.tabs.push({ lang: lang, labelKey: 'language.' + lang });
        });
      });

      $scope.study = DraftStudyResource.get(
        {id: $routeParams.id},
        function (study) {
          new $.MicaTimeline(new $.StudyDtoParser()).create("#timeline", study).addLegend();
        });

      $scope.studySummary = DraftStudySummaryResource.get({id: $routeParams.id});

      $scope.months = $locale.DATETIME_FORMATS.MONTH;

      $scope.$on('studyUpdatedEvent', function (event, studyUpdated) {
        if (studyUpdated == $scope.study) {
          $log.debug('save study', studyUpdated);

          $scope.study.$save(function () {
              $scope.study = DraftStudyResource.get({id: $scope.study.id});
            },
            function (response) {
              $log.error('Error on study save:', response);
              $rootScope.$broadcast('showNotificationDialogEvent', {
                iconClass: "fa-exclamation-triangle",
                titleKey: "study.save-error",
                message: response.data ? response.data : angular.fromJson(response)
              });
            });
        }
      });
      $scope.publish = function () {
        DraftStudyPublicationResource.publish({id: $scope.study.id}, function () {
          $scope.studySummary = DraftStudySummaryResource.get({id: $routeParams.id});
        });
      };

      $scope.sortableOptions = {
        stop: function (e, ui) {
          $scope.$emit('studyUpdatedEvent', $scope.study);
        }
      };

      $scope.$on('addInvestigatorEvent', function (event, study, contact) {
        if (study == $scope.study) {
          if (!$scope.study.investigators) $scope.study.investigators = [];
          $scope.study.investigators.push(contact);
          $scope.$emit('studyUpdatedEvent', $scope.study);
        }
      });

      $scope.$on('addContactEvent', function (event, study, contact) {
        if (study == $scope.study) {
          if (!$scope.study.contacts) $scope.study.contacts = [];
          $scope.study.contacts.push(contact);
          $scope.$emit('studyUpdatedEvent', $scope.study);
        }
      });

      $scope.$on('contactUpdatedEvent', function (event, study, contact) {
        if (study == $scope.study) {
          $scope.$emit('studyUpdatedEvent', $scope.study);
        }
      });

      $scope.$on('contactEditionCanceledEvent', function (event, study) {
        if (study == $scope.study) {
          $scope.study = DraftStudyResource.get({id: $scope.study.id});
        }
      });

      $scope.$on('contactDeletedEvent', function (event, study, contact, isInvestigator) {
        if (study == $scope.study) {
          if (isInvestigator) {
            var investigatorsIndex = $scope.study.investigators.indexOf(contact);
            if (investigatorsIndex != -1) $scope.study.investigators.splice(investigatorsIndex, 1);
          } else {
            var contactsIndex = $scope.study.contacts.indexOf(contact);
            if (contactsIndex != -1) $scope.study.contacts.splice(contactsIndex, 1);
          }
          $scope.$emit('studyUpdatedEvent', $scope.study);
        }
      });

    }])

  .controller('StudyEditController', ['$rootScope', '$scope', '$routeParams', '$log', '$location', 'DraftStudyResource', 'DraftStudiesResource', 'MicaConfigResource',

    function ($rootScope, $scope, $routeParams, $log, $location, DraftStudyResource, DraftStudiesResource, MicaConfigResource) {

      $scope.study = $routeParams.id ? DraftStudyResource.get({id: $routeParams.id}) : {};
      $log.debug('Edit study', $scope.study);

      MicaConfigResource.get(function (micaConfig) {
        $scope.tabs = [];
        micaConfig.languages.forEach(function (lang) {
          $scope.tabs.push({ lang: lang, labelKey: 'language.' + lang });
        });
      });

      $scope.save = function () {
        if (!$scope.form.$valid) {
          $scope.form.saveAttempted = true;
          return;
        }
        if ($scope.study.id) {
          $scope.updateStudy();
        } else {
          $scope.createStudy()
        }
      };

      $scope.createStudy = function () {
        $log.debug('Create new study', $scope.study);
        DraftStudiesResource.save($scope.study,
          function (resource, getResponseHeaders) {
            var parts = getResponseHeaders().location.split('/');
            $location.path('/study/' + parts[parts.length - 1]).replace();
          },
          function (response) {
            $scope.saveErrorHandler(response);
          })
      };

      $scope.updateStudy = function () {
        $log.debug('Update study', $scope.study);
        $scope.study.$save(
          function (study) {
            $location.path('/study/' + study.id).replace();
          },
          function (response) {
            $scope.saveErrorHandler(response);
          });
      };

      $scope.saveErrorHandler = function (response) {
        $log.error('Error on study save:', response);
        if (response.data instanceof Array) {
          $scope.errors = [];
          response.data.forEach(function (error) {
            //$log.debug('error: ', error);
            var field = error.path.substring(error.path.indexOf('.') + 1);
            $scope.form[field].$dirty = true;
            $scope.form[field].$setValidity('server', false);
            $scope.errors[field] = error.message;
          });
        } else {
          $rootScope.$broadcast('showNotificationDialogEvent', {
            iconClass: "fa-exclamation-triangle",
            titleKey: "study.save-error",
            message: response.data ? response.data : angular.fromJson(response)
          });
        }
      };

      $scope.cancel = function () {
        $location.path('/study' + ($scope.study.id ? '/' + $scope.study.id : '')).replace();
      };

    }]);
