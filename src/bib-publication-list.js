
var bibtexify = (function($) {
    // helper function to "compile" LaTeX special characters to HTML
    var htmlify = function(str) {
        // TODO: this is probably not a complete list..
        str = str.replace(/\\"\{a\}/g, '&auml;')
            .replace(/\{\\aa\}/g, '&aring;')
            .replace(/\\aa\{\}/g, '&aring;')
            .replace(/\\"a/g, '&auml;')
            .replace(/\\"\{o\}/g, '&ouml;')
            .replace(/\\'e/g, '&eacute;')
            .replace(/\\'\{e\}/g, '&eacute;')
            .replace(/\\'a/g, '&aacute;')
            .replace(/\\'A/g, '&Aacute;')
            .replace(/\\"o/g, '&ouml;')
            .replace(/\\ss\{\}/g, '&szlig;')
            .replace(/\{/g, '')
            .replace(/\}/g, '')
            .replace(/\\&/g, '&')
            .replace(/--/g, '&ndash;');
        return str;
    };
    var uriencode = function(str) {
        // TODO: this is probably not a complete list..
        str = str.replace(/\\"\{a\}/g, '%C3%A4')
            .replace(/\{\\aa\}/g, '%C3%A5')
            .replace(/\\aa\{\}/g, '%C3%A5')
            .replace(/\\"a/g, '%C3%A4')
            .replace(/\\"\{o\}/g, '%C3%B6')
            .replace(/\\'e/g, '%C3%A9')
            .replace(/\\'\{e\}/g, '%C3%A9')
            .replace(/\\'a/g, '%C3%A1')
            .replace(/\\'A/g, '%C3%81')
            .replace(/\\"o/g, '%C3%B6')
            .replace(/\\ss\{\}/g, '%C3%9F')
            .replace(/\{/g, '')
            .replace(/\}/g, '')
            .replace(/\\&/g, '%26')
            .replace(/--/g, '%E2%80%93');
        return str;
    };
    // helper functions to turn a single bibtex entry into HTML
    var bib2html = {
        // the main function which turns the entry into HTML
        entry2html: function(entryData, bib) {
            var type = entryData.entryType.toLowerCase();
            // default to type misc if type is unknown
            if(array_keys(bib2html).indexOf(type) === -1) {
                type = 'misc';
                entryData.entryType = type;
            }
            var itemStr = htmlify(bib2html[type](entryData));
            itemStr += bib2html.links(entryData);
            itemStr += bib2html.bibtex(entryData);
            if (bib.options.tweet && entryData.url) {
                itemStr += bib2html.tweet(entryData, bib);
            }
            return itemStr.replace(/undefined/g,
                                   '<span class="undefined">missing<\/span>');
        },
        // converts the given author data into HTML
        authors2html: function(authorData) {
            var authorsStr = '';
            for (var index = 0; index < authorData.length; index++) {
                if (index > 0) { authorsStr += " and "; }
                authorsStr += bib2html.formatAuthor(authorData[index]);
            }
            return htmlify(authorsStr);
        },
        // adds links to the PDF or url of the item
        links: function(entryData) {
            var itemStr = '';
            if (entryData.url && entryData.url.match(/.*\.pdf/)) {
                itemStr += ' [<a title="PDF-version of this article" target="_blank" href="' +
                            entryData.url + '">pdf<\/a>]';
            } else if (entryData.url) {
                itemStr += ' [<a title="This article online" target="_blank" href="' + entryData.url +
                            '">link<\/a>]';
            }
            return itemStr;
        },
        // adds the bibtex link and the opening div with bibtex content
        bibtex: function(entryData) {
            var content = '@' + entryData.entryType + "{" + entryData.cite + ",\n";
            $.each(entryData, function(key, value) {
                if (key == 'author') {
                    content += '  author = { ';
                    for (var index = 0; index < value.length; index++) {
                        if (index > 0) { content += " and "; }
                        content += bib2html.formatAuthor(value[index]);
                    }
                    content += ' },\n';
                } else if (key == 'editor') {
                    content += '  author = { ';
                    for (var index = 0; index < value.length; index++) {
                        if (index > 0) { content += " and "; }
                        content += bib2html.formatAuthor(value[index]);
                    }
                    content += ' },\n';
                } else if (key != 'entryType' && key != 'cite') {
                    content += '  ' + key + " = { " + value + " },\n";
                }
            });
            content += '}';

            var itemStr = '';
            itemStr += ' [<a title="This article as BibTeX" href="#" class="biblink" data-content="' + content + '">' +
                        'bib</a>]';
            itemStr += '<div class="bibinfo hidden">';
            itemStr += '<a href="#" class="bibclose" title="Close">x</a><pre>';
            itemStr += content;
            itemStr += "</pre></div>";

            return itemStr;
        },
        // Returns the author formatted
        formatAuthor: function(array) {
            var authorstring = '';
            if (array.first.length > 0)
                authorstring += 'FIRST';
            if (array.von.length > 0) {
                if (authorstring.length > 0)
                    authorstring += ' ';
                authorstring += 'VON'
            }
            if (array.last.length > 0) {
                if (authorstring.length > 0)
                    authorstring += ' ';
                authorstring += 'LAST'
            }
            if (array.jr.length > 0) {
                if (authorstring.length > 0)
                    authorstring += ' ';
                authorstring += 'JR'
            }
            ret = authorstring;
            ret = str_replace("VON", array['von'], ret);
            ret = str_replace("LAST", array['last'], ret);
            ret = str_replace("JR", array['jr'], ret);
            ret = str_replace("FIRST", array['first'], ret);
            return trim(ret);
        },
        // generates the twitter link for the entry
        tweet: function(entryData, bib) {
          // url, via, text
          var itemStr = ' (<a title="Tweet this article" href="http://twitter.com/share?url=';
          itemStr += entryData.url;
          itemStr += '&via=' + bib.options.tweet;
          itemStr += '&text=';
          var splitName = function(wholeName) {
            var spl = wholeName.split(' ');
            return spl[spl.length-1];
          };
          var auth = entryData.author;
          if (auth.length == 1) {
            itemStr += uriencode(splitName(auth[0].last));
          } else if (auth.length == 2) {
            itemStr += uriencode(splitName(auth[0].last) + "%26" + splitName(auth[1].last));
          } else {
            itemStr += uriencode(splitName(auth[0].last) + " et al");
          }
          itemStr += ": " + encodeURIComponent('"' + entryData.title + '"');
          itemStr += '" target="_blank">tweet</a>)';
          return itemStr;
        },
        // helper functions for formatting different types of bibtex entries
        inproceedings: function(entryData) {
            var formatstring = this.authors2html(entryData.author) + ". ";
            formatstring += entryData.title + ". ";
            formatstring += "In <em>" + entryData.booktitle + "<\/em>, ";
            formatstring += ((entryData.series) ? entryData.series + ", " : "");
            formatstring += ((entryData.pages) ? "pages " + entryData.pages + ", " : "");
            formatstring += ((entryData.address) ? entryData.address + ", " : "");
            formatstring += ((entryData.month) ? entryData.month + " " : "");
            formatstring += entryData.year + ".";
            formatstring += ((entryData.publisher) ? " " + entryData.publisher + "." : "");
            return formatstring;
        },
        proceedings: function(entryData) {
            var formatstring = '';
            formatstring += this.authors2html(entryData.editor) + ', '
            formatstring += ((entryData.editor.length > 1) ? "editors. " : "editor. ");
            formatstring += "<em>" + entryData.title + "<\/em>, ";
            formatstring += ((entryData.volume) ? "volume " + entryData.volume + ", " : "");
            formatstring += ((entryData.address) ? entryData.address + ", " : "");
            formatstring += ((entryData.month) ? entryData.month + " " : "");
            formatstring += entryData.year + ". ";
            if (entryData.organization && entryData.publisher) 
                formatstring += entryData.organization + ", " + entryData.publisher;
            else {
                formatstring += ((entryData.organization) ? entryData.organization + "." : "");
                formatstring += ((entryData.publisher) ? entryData.publisher + "." : "");
            }
            return formatstring;
        },
        article: function(entryData) {
            var formatstring = this.authors2html(entryData.author) + ". ";
            formatstring += entryData.title + ". ";
            formatstring += "<em>" + entryData.journal + "<\/em>, ";
            formatstring += ((entryData.series) ? entryData.series + ", " : "");
            if (entryData.volume || entryData.number) {
                if (entryData.volume)
                    formatstring += entryData.volume;
                if (entryData.number)
                    formatstring += "(" + entryData.number + ")";
                if (entryData.pages)
                    formatstring += ":" + entryData.pages;
                formatstring += ", ";
            }
            else if (entryData.pages) {
                formatstring += "pages " + entryData.pages + ", ";
            }
            formatstring += ((entryData.month) ? entryData.month + " " : "");
            formatstring += entryData.year + ".";
            return formatstring;
        },
        misc: function(entryData) {
            var formatstring = this.authors2html(entryData.author) + ". ";
            formatstring += entryData.title;
            formatstring += ((entryData.year) ? ", " + entryData.year + "." : ".");
            return formatstring;
        },
        mastersthesis: function(entryData) {
            var formatstring = this.authors2html(entryData.author) + ". ";
            formatstring += "<em>" + entryData.title + "<\/em>. ";
            formatstring += ((entryData.type) ? entryData.type + ", " : "");
            formatstring += ((entryData.school) ? entryData.school + ", " : "");
            formatstring += ((entryData.address) ? entryData.address + ", " : "");
            formatstring += ((entryData.month) ? entryData.month + " " : "");
            formatstring += entryData.year + ".";
            return formatstring;
        },
        techreport: function(entryData) {
            var formatstring = this.authors2html(entryData.author) + ". ";
            formatstring += entryData.title + ". ";
            formatstring += ((entryData.type) ? entryData.type : "Technical Report");
            formatstring += ((entryData.number) ? " " + entryData.number + ", " : ", ");
            formatstring += ((entryData.institute) ? entryData.institute + ", " : "");
            formatstring += ((entryData.address) ? entryData.address + ", " : "");
            formatstring += ((entryData.month) ? entryData.month + " " : "");
            formatstring += entryData.year + ".";
            return formatstring;
        },
        book: function(entryData) {
            var formatstring = this.authors2html(entryData.author) + ". ";
            formatstring += "<em>" + entryData.title + "<\/em>";
            if (entryData.volume) {
                formatstring += ", volume " + entryData.volume;
                if (entryData.series) 
                    formatstring += " of <em>" + entryData.series + "<\/em>";
                formatstring += ". ";
            }
            else if (entryData.number) {
                formatstring += ". Number " + entryData.number;
                if (entryData.series) 
                    formatstring += " in " + entryData.series + "";
                formatstring += ". ";   
            }
            else if (entryData.series) {
                formatstring += ". " + entryData.series + ". ";
            }
            formatstring += ((entryData.publisher) ? entryData.publisher + ", " : "");
            formatstring += ((entryData.address) ? entryData.address + ", " : "");
            formatstring += ((entryData.edition) ? "edition " + entryData.edition + ", " : "");
            formatstring += ((entryData.month) ? entryData.month + " " : "");
            formatstring += entryData.year + ".";
            return formatstring;
        },
        inbook: function(entryData) {
            var formatstring = this.authors2html(entryData.author) + ". ";
            formatstring += "<em>" + entryData.title + "<\/em>. ";
            if (entryData.volume) {
                formatstring += "volume " + entryData.volume;
                if (entryData.series) {
                    formatstring += " of <em>" + entryData.series + "<\/em>";
                }
                formatstring += ", ";
            }
            if (entryData.chapter) {
                formatstring += ((entryData.type) ? entryData.type + " " : "");
                formatstring += entryData.chapter + ", ";       
            }
            formatstring += ((entryData.pages) ? "pages " + entryData.pages + ". " : "");
            if (!entryData.volume && entryData.series) {
                if (entryData.number) 
                    formatstring += "Number " + entryData.number + " in ";    
                formatstring += entryData.series + ". ";
            }
            formatstring += ((entryData.publisher) ? " " + entryData.publisher + ", " : "");
            formatstring += ((entryData.address) ? entryData.address + ", " : "");
            formatstring += ((entryData.month) ? entryData.month + " " : "");
            formatstring += entryData.year + ".";
            return formatstring;
        },
        // weights of the different types of entries; used when sorting
        importance: {
            'TITLE': 9999,
            'misc': 0,
            'manual': 10,
            'techreport': 20,
            'mastersthesis': 30,
            'inproceedings': 40,
            'incollection': 50,
            'proceedings': 60,
            'conference': 70,
            'article': 80,
            'phdthesis': 90,
            'inbook': 100,
            'book': 110,
            'unpublished': 120
        },
        // labels used for the different types of entries
        labels: {
            'article': 'Journal',
            'book': 'Book',
            'conference': 'Conference',
            'inbook': 'Book chapter',
            'incollection': '',
            'inproceedings': 'Conference',
            'manual': 'Manual',
            'mastersthesis': 'Thesis',
            'misc': 'Misc',
            'phdthesis': 'PhD Thesis',
            'proceedings': 'Conference proceeding',
            'techreport': 'Technical report',
            'unpublished': 'Unpublished'}
    };
    // format a phd thesis similarly to masters thesis
    bib2html.phdthesis = bib2html.mastersthesis;
    // conference is the same as inproceedings
    bib2html.conference = bib2html.inproceedings;

    // event handlers for the bibtex links
    var EventHandlers = {
        showbib: function showbib(event) {
            $(this).next(".bibinfo").removeClass('hidden').addClass("open");
            $("#shutter").show();
            event.preventDefault();
        },
        hidebib: function hidebib(event) {
            $("#shutter").hide();
            $(".bibinfo.open").removeClass("open").addClass("hidden");
            event.preventDefault();
        }
    };

    var Bib2HTML = function(data, $pubTable, options) {
        this.options = options;
        this.$pubTable = $pubTable;
        this.stats = { };
        this.initialize(data);
    };
    var bibproto = Bib2HTML.prototype;
    bibproto.initialize = function initialize(data) {
        var bibtex = new BibTex();
        bibtex.content = data;
        bibtex.parse();
        var bibentries = [], len = bibtex.data.length;
        var entryTypes = {};
        jQuery.extend(true, bib2html, this.options.bib2html);
        for (var index = 0; index < len; index++) {
            var item = bibtex.data[index];
            if (!item.year) {
              item.year = this.options.defaultYear || "To Appear";
            }
            var html = bib2html.entry2html(item, this);
            bibentries.push([item.year, bib2html.labels[item.entryType], html]);
            entryTypes[bib2html.labels[item.entryType]] = item.entryType;
            this.updateStats(item);
        }
        jQuery.fn.dataTableExt.oSort['type-sort-asc'] = function(x, y) {
            var item1 = bib2html.importance[entryTypes[x]],
                item2 = bib2html.importance[entryTypes[y]];
            return ((item1 < item2) ? -1 : ((item1 > item2) ?  1 : 0));
        };
        jQuery.fn.dataTableExt.oSort['type-sort-desc'] = function(x, y) {
            var item1 = bib2html.importance[entryTypes[x]],
                item2 = bib2html.importance[entryTypes[y]];
            return ((item1 < item2) ? 1 : ((item1 > item2) ?  -1 : 0));
        };
        var table = this.$pubTable.dataTable({ 'aaData': bibentries,
                              'aaSorting': this.options.sorting,
                              'aoColumns': [ { "sTitle": "Year" },
                                             { "sTitle": "Type", "sType": "type-sort", "asSorting": [ "desc", "asc" ] },
                                             { "sTitle": "Publication", "bSortable": false }],
                              'bPaginate': false
                            });
        if (this.options.visualization) {
            this.addBarChart();
        }
        $("th", this.$pubTable).unbind("click").click(function(e) {
          var $this = $(this),
              $thElems = $this.parent().find("th"),
              index = $thElems.index($this);
          if ($this.hasClass("sorting_disabled")) { return; }
          $this.toggleClass("sorting_asc").toggleClass("sorting_desc");

          if (index === 0) {
            table.fnSort( [[0, $thElems.eq(0).hasClass("sorting_asc")?"asc":"desc"],
                        [1, $thElems.eq(1).hasClass("sorting_asc")?"asc":"desc"]]);
          } else {
            table.fnSort( [[1, $thElems.eq(1).hasClass("sorting_asc")?"asc":"desc"],
                          [0, $thElems.eq(0).hasClass("sorting_asc")?"asc":"desc"]]);
          }
        });
        // attach the event handlers to the bib items
        if ($.fn.modal) {
            var modalStr = '';
            modalStr += '<div class="ui modal bibtex segment">';
            modalStr += '  <i class="close icon"></i>';
            modalStr += '  <div class="description">';
            modalStr += '    <p class="content"></p>';
            modalStr += '  </div>';
            modalStr += '</div>'; 
            this.$pubTable.after(modalStr);
            $(".biblink", this.$pubTable).on('click', function() {
                var content = $(this).attr('data-content');
                $('.modal.bibtex').find('.content').html(content.replace(/\n/g, "<br />"));
                $('.modal.bibtex').modal('show');
            });
        }
        else {
            $(".biblink", this.$pubTable).on('click', EventHandlers.showbib);
            $(".bibclose", this.$pubTable).on('click', EventHandlers.hidebib);
        }
    };
    // updates the stats, called whenever a new bibtex entry is parsed
    bibproto.updateStats = function updateStats(item) {
        if (!this.stats[item.year]) {
            this.stats[item.year] = { 'count': 1, 'types': {} };
            this.stats[item.year].types[item.entryType] = 1;
        } else {
            this.stats[item.year].count += 1;
            if (this.stats[item.year].types[item.entryType]) {
                this.stats[item.year].types[item.entryType] += 1;
            } else {
                this.stats[item.year].types[item.entryType] = 1;
            }
        }
    };
    // adds the barchart of year and publication types
    bibproto.addBarChart = function addBarChart() {
        var yearstats = [], max = 0;
        $.each(this.stats, function(key, value) {
            max = Math.max(max, value.count);
            yearstats.push({'year': key, 'count': value.count,
                'item': value, 'types': value.types});
        });
        yearstats.sort(function(a, b) {
            var diff = a.year - b.year;
            if (!isNaN(diff)) {
              return diff;
            } else if (a.year < b.year) {
              return -1;
            } else if (a.year > b.year) {
              return 1;
            }
            return 0;
        });
        var chartIdSelector = "#" + this.$pubTable[0].id + "pubchart";
        var pubHeight = $(chartIdSelector).height()/max - 2;
        var styleStr = chartIdSelector +" .year { width: " +
                        (100.0/yearstats.length) + "%; }" +
                        chartIdSelector + " .pub { height: " + pubHeight + "px; }";
        var legendTypes = [];
        var stats2html = function(item) {
            var types = [],
                str = '<div class="year">',
                sum = 0;
            $.each(item.types, function(type, value) {
              types.push(type);
              sum += value;
            });
            types.sort(function(x, y) {
              return bib2html.importance[y] - bib2html.importance[x];
            });
            str += '<div class="filler" style="height:' + ((pubHeight+2)*(max-sum)) + 'px;"></div>';
            for (var i = 0; i < types.length; i++) {
                var type = types[i];
                if (legendTypes.indexOf(type) === -1) {
                    legendTypes.push(type);
                }
                for (var j = 0; j < item.types[type]; j++) {
                    str += '<div class="pub ' + type + '"></div>';
                }
            }
            return str + '<div class="yearlabel">' + item.year + '</div></div>';
        };
        var statsHtml = "<style>" + styleStr + "</style>";
        yearstats.forEach(function(item) {
            statsHtml += stats2html(item);
        });
        var legendHtml = '<div class="legend">';
        for (var i = 0, l = legendTypes.length; i < l; i++) {
            var legend = legendTypes[i];
            legendHtml += '<span class="pub ' + legend + '"></span>' + bib2html.labels[legend];
        }
        legendHtml += '</div>';
        $(chartIdSelector).html(statsHtml).after(legendHtml);
    };

    // Creates a new publication list to the HTML element with ID
    // bibElemId. The bibsrc can be
    //   - a jQuery selector, in which case html of the element is used
    //     as the bibtex data
    //   - a URL, which is loaded and used as data. Note, that same-origin
    //     policy restricts where you can load the data.
    // Supported options: 
    //   - visualization: A boolean to control addition of the visualization.
    //                    Defaults to true.
    //   - tweet: Twitter username to add Tweet links to bib items with a url field.
    //   - sorting: Control the default sorting of the list. Defaults to [[0, "desc"], 
    //              [1, "desc"]]. See http://datatables.net/api fnSort for details 
    //              on formatting.
    //   - bib2html: Can be used to override any of the functions or properties of
    //               the bib2html object. See above, starting around line 40.
    return function(bibsrc, bibElemId, opts) {
        var options = $.extend({}, {'visualization': true,
                                'sorting': [[0, "desc"], [1, "desc"]]},
                                opts);
        var $pubTable = $("#" + bibElemId).addClass("bibtable");
        if ($("#shutter").size() === 0) {
            $pubTable.before('<div id="shutter" class="hidden"></div>');
            $("#shutter").click(EventHandlers.hidebib);
        }
        if (options.visualization) {
            $pubTable.before('<div id="' + bibElemId + 'pubchart" class="bibchart"></div>');
        }
        var $bibSrc = $(bibsrc);
        if ($bibSrc.length) { // we found an element, use its HTML as bibtex
            new Bib2HTML($bibSrc.html(), $pubTable, options);
            $bibSrc.hide();
        } else { // otherwise we assume it is a URL
            var callbackHandler = function(data) {
                new Bib2HTML(data, $pubTable, options);
            };
            $.get(bibsrc, callbackHandler, "text");
        }
    };
})(jQuery);