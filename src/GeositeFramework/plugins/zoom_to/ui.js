
define([],
    function () {

        ////////////////////////////////
        // TEMPLATES
        ////////////////////////////////

        var inputTemplate = ['<div class="pluginZoomTo">',
                               '<input type="text" placeholder="Search by Address" value="<%= inputValue %>" />',
                               '<div id="pluginZoomTo-clearSearch">&#10006;</div>',
                               '<div id="pluginZoomTo-choices"></div>',
                             '</div>'
                             ].join(""),
            locationTemplate = '<a href="javascript:;"><%= address %></a>',
            searchErrorText = "There was an error completing your request.";


        ////////////////////////////////
        // MODEL CLASS
        ////////////////////////////////

        var UiInput = Backbone.Model.extend({

            defaults: {
                // set by view, listened internally
                inputValue: "",
                hasFocus: false,

                // set internally, listened by view
                showingInput: false,
                showingLocationBox: false,
                addressCandidates: [],
                addressError: false
            },

            initialize: function () {
                // Manage the state of some attributes based on the value
                // of other attributes. The view sets some simple attributes
                // and the other managed based on the state of the model
                // at the time of change.

                var model = this;

                // a private member used to access ajax requests
                // that are in progress.
                model._activeRequest = null;


                this.on("change:inputValue", function () {
                    model.set('addressCandidates', []);
                    model.set('addressError', false);
                    model.abortGeocodeRequest();

                    if (model.get('inputValue') === "") {
                        model.set('showingLocationBox', false);
                    }
                });
            },

            setupLocator: function(url, map, zoomLevel, pointConstructor) {
                // After the map is finished loading, the plugin will
                // call this method and provide these values. This
                // object is needed to geocode and to plot points.
                this.locator = {
                    url: url,
                    map: map,
                    zoomLevel: zoomLevel,
                    point: pointConstructor
                };
            },

            abortGeocodeRequest: function () {
                // helper method to abort any active ajax requests
                // to make sure that there is only one in the pipeline.
                // This is a separate method because it can be called:
                // 1) When a new request is made.
                // 2) When the input box is cleared.
                
                if (this._activeRequest !== null) {
                    this._activeRequest.abort();
                } else {
                    this._activeRequest = null;
                }
            },


            geocodeAddress: function () {
                // Make an ajax request to the geocoder URL provided by 
                // the plugin conf. Returns an array of candidates with
                // latlng values on success, an error on failure.
                var model = this,
                    singleLine =  this.get('inputValue'),
                    url = [this.locator.url, "text=",
                           singleLine, "&outFields=type&2Ccity&2Cregion",
                           "&f=pjson&callback=?&maxLocations=20"
                           ].join("");

                model.abortGeocodeRequest();

                model.set('showingLocationBox', true);

                model._activeRequest = $.jsonp({ 
                    url: url,
                    timeout: 12000,
                    success: function (results) { 
                        if (results.locations.length > 0) {
                            model.set('addressCandidates', results.locations);
                        } else {
                            model.set('addressError', true);
                        }
                    },
                    error: function (error) { model.set('addressError', true); }
                });
            }
        });


        ////////////////////////////////
        // VIEW CLASS
        ////////////////////////////////

        var UiInputView = Backbone.View.extend({

            events: {
                "click #pluginZoomTo-clearSearch": function (e) {
                    this.clear();
                },
                "blur input": function () { this.model.set('hasFocus', false); },
                "focus input": function () { this.model.set('hasFocus', true); },
                "keypress input": function (event) { this.handleKeyPress(event); }
            },

            buildCandidateEvents: function () {

                var candidates = this.model.get("addressCandidates"),
                    view = this,
                    $wrapHtml = function (candidate) {
                        // take a location candidate and build a dom fragment
                        // and click event to center and zoom over the candidate's
                        // geopoint.

                        var x = candidate.feature.geometry.x,
                            y = candidate.feature.geometry.y,
                            $fragment = $(_.template(locationTemplate)({ 
                                address: candidate.name,
                                x: x,
                                y: y
                            }));
                        $fragment.click(function(e) {
                            view.centerAndZoom(x, y, candidate.extent);
                            view._cancelEventBubble(e);
                        });
                        return $fragment;
                    };
                
                    return _.map(candidates, $wrapHtml);
            },

            renderLocationBox: function (content) {
                this.$("#pluginZoomTo-choices")
                    .empty()
                    .append(content);
            },

            centerAndZoom: function (x, y, rawExtentObj) {
                var extent = new esri.geometry.Extent(rawExtentObj);
                this.model.locator.map.setExtent(extent);
            },

            handleKeyPress: function (event) {
                this.model.set("inputValue", this.$("input").val());

                if (event.which === 13) {
                    this.model.geocodeAddress();
                    
                    // I'm not entirely sure what the default action of IE is
                    // when the user presses the enter key in a text box, but
                    // whatever it is, it makes this plugin break.  So don't
                    // do the default.
                    event.preventDefault();
                }
            },

            initialize: function () {
                var view = this;
                view.render();

                view.listenTo(this.model, "change:showingInput change:showingLocationBox", function () {
                    var $root = view.$('.pluginZoomTo');
                    if (view.model.get('showingInput') === true) {
                        $root.addClass("pluginZoomTo-showing-input");
                        if (view.model.get('showingLocationBox') === true) {
                            $root.addClass("pluginZoomTo-with-choices");
                            view.$('#pluginZoomTo-choices').empty();
                            view.$('#pluginZoomTo-choices').append(
                                '<div class="pluginZoomTo-progressIndicator"></div>');
                        } else {
                            $root.removeClass("pluginZoomTo-with-choices");
                        }
                    } else {
                        view.$('input').val("");
                        $root.removeClass("pluginZoomTo-showing-input");
                        $root.removeClass("pluginZoomTo-with-choices");
                    }
                });

                view.listenTo(this.model, "change:addressCandidates change:addressError", function () {
                    if (view.model.get('addressError') === true) {
                        view.renderLocationBox(searchErrorText);
                    } else if (view.model.get('addressCandidates') !== []) {
                        view.renderLocationBox(view.buildCandidateEvents());
                    }
                });
            },

            render: function () {
                var renderedTemplate = _.template(inputTemplate)(this.model.toJSON());
                this.$el
                    .empty()
                    .append(renderedTemplate)
                    .show();
            },

            clear: function() {
                this.model.set({
                    inputValue: "",
                    addressCandidates: []
                });
            }
        });

        // This enables the plugin to use these backbone classes
        return { UiInput: UiInput, UiInputView: UiInputView };
        
    });
