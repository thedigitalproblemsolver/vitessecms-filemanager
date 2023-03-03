$(function () {
    $(document).ajaxStart(function () {
        $('.filemanager .loading').css('display', 'flex');
        ui.fadeIn('.filemanager .loading');
    });
    $(document).ajaxStop(function () {
        ui.fadeOut('.filemanager .loading');
        $('.filemanager .loading').css('display', 'none');
    });

    // Upload functions
    $('#uploadButton').on('click', function (e) {
        e.preventDefault();
        $('#file').trigger('click');
    });
    $("#file").on('change', function () {
        uploadFile();
    });

    //addDirectory functions
    $('#addDirectory').on('click', function (e) {
        this.href = addParam('parent', $('#directory').val(), this.href);
    });

    var filemanager = $('.filemanager'),
        breadcrumbs = $('.breadcrumbs'),
        fileList = filemanager.find('.data'),
        baseUri = window.location.protocol + "//" + window.location.hostname;

    // Start by fetching the file data from scan.php with an AJAX request
    $.get(baseUri + '/filemanager/index/scan/', function (data) {

        var response = [data],
            currentPath = '',
            breadcrumbsUrls = [];

        var folders = [],
            files = [];

        // This event listener monitors changes on the URL. We use it to
        // capture back/forward navigation in the browser.

        $(window).on('hashchange', function () {
            goto(window.location.hash);
        }).trigger('hashchange');

        filemanager.find('.fa-search').on('click', function (e) {
            doSearch($('#search').val());
        });

        filemanager.find('#search').on('keyup', function (e) {
            doSearch($(this).val());
        });

        // Clicking on folders

        fileList.on('click', 'li.folders', function (e) {
            e.preventDefault();
            var nextDir = $(this).find('a.folders').attr('href');
            if (filemanager.hasClass('searching')) {
                // Building the breadcrumbs
                breadcrumbsUrls = generateBreadcrumbs(nextDir);
            } else {
                breadcrumbsUrls.push(nextDir);
            }
            window.location.hash = encodeURIComponent(nextDir);
            currentPath = nextDir;
        });

        // Navigates to the given hash (path)
        function goto(hash) {
            hash = decodeURIComponent(hash).slice(1).split('=');
            if (hash.length) {
                var rendered = '';
                var search = GetURLParameter('search').toLowerCase();
                var path = GetURLParameter('path');
                if (path !== '') {
                    data.path = path;
                }
                // if hash has search in it
                if (search !== '' && $('#search').val() === '') {
                    $('#search').val(search);
                    currentPath = data.path;
                    breadcrumbsUrls.push(data.path);
                    render(searchByPath(data.path));
                } else if (path !== '') {
                    rendered = searchByPath(path);
                    currentPath = path;
                    breadcrumbsUrls = generateBreadcrumbs(path);
                    render(rendered);
                } else {
                    currentPath = data.path;
                    breadcrumbsUrls.push(data.path);
                    render(searchByPath(data.path));
                }
            }
        }

        // Splits a file path and turns it into clickable breadcrumbs

        function generateBreadcrumbs(nextDir) {
            var path = nextDir.split('/').slice(0);
            for (var i = 1; i < path.length; i++) {
                path[i] = path[i - 1] + '/' + path[i];
            }
            return path;
        }

        // Locates a file by path
        function searchByPath(dir) {
            var path = dir.split('/'),
                demo = response,
                flag = 0;

            for (var i = 0; i < path.length; i++) {
                for (var j = 0; j < demo.length; j++) {
                    if (demo[j].name === path[i]) {
                        flag = 1;
                        demo = demo[j].items;
                        break;
                    }
                }
            }

            demo = flag ? demo : [];
            return demo;
        }


        // Recursively search through the file tree

        function searchData(data, searchTerms) {
            data.forEach(function (d) {
                if (d.type === 'folder') {
                    searchData(d.items, searchTerms);
                    if (d.name.toLowerCase().match(searchTerms)) {
                        folders.push(d);
                    }
                } else if (d.type === 'file') {
                    if (d.name.toLowerCase().match(searchTerms)) {
                        files.push(d);
                    }
                }
            });
            return {folders: folders, files: files};
        }

        function doSearch(searchPartial) {
            searchPartial = searchPartial.toLowerCase().trim();
            files.forEach(function (f) {
                if (searchPartial === '') {
                    $('#hash_' + f.hash).show();
                } else {
                    if (substr_count(f.name.toLowerCase(), searchPartial) > 0) {
                        $('#hash_' + f.hash).show();
                    } else {
                        $('#hash_' + f.hash).hide();
                    }
                }
            });

            $(window).scroll();
        }

        // Render the HTML for the file manager
        function render(data) {
            var scannedFolders = [],
                scannedFiles = [];

            if (Array.isArray(data)) {
                data.forEach(function (d) {
                    if (d.type === 'folder') {
                        scannedFolders.push(d);
                    } else if (d.type === 'file') {
                        scannedFiles.push(d);
                    }
                });
            } else if (typeof data === 'object') {
                scannedFolders = data.folders;
                scannedFiles = data.files;
            }
            // Empty the old result and make the new one

            fileList.empty();
            ui.fadeOut('.filemanager .data');

            if (!scannedFolders.length && !scannedFiles.length) {
                ui.alert('No files found', 'danger');
            } else {
                ui.fadeOut('.alert');
            }

            url = removeParam('path', window.location.toString());
            url = removeParam('search', url);
            if (scannedFolders.length) {
                scannedFolders.forEach(function (f) {
                    var itemsLength = f.items.length,
                        name = escapeHTML(f.name);

                    var buttons = '';
                    if (itemsLength === 0) {
                        buttons = '<div class="btn-group btn-group-sm">' +
                            '<a ' +
                            'id="delete_hash_' + f.hash + '" ' +
                            'href="/admin/filemanager/admindirectory/delete?path=' + btoa(f.path) + '" ' +
                            'class="btn btn-outline-light fa fa-trash"' +
                            '></a>' +
                            '</div>';
                    }

                    var newUrl = addParam('path', f.path, url);
                    var folder = $('<div id="hash_' + f.hash + '" class="card text-center mb-4">' +
                        buttons +
                        '<a href="' + newUrl + '" title="' + f.path + '" class="fa fa-folder p-3"></a>' +
                        '<div class="card-footer">' +
                        '<small>' + name + '</small>' +
                        '</div>' +
                        '</div>');
                    folder.appendTo(fileList);
                });
            }

            if (scannedFiles.length) {
                scannedFiles.forEach(function (f) {
                    var fileSize = bytesToSize(f.size),
                        name = escapeHTML(f.name),
                        fileType = name.split('.'),
                        icon = '<span class="icon file"></span>';

                    var fileUrl = baseUri + '/uploads/' + escape(f.thumbpath);
                    var fileBtoA = btoa(escape(f.thumbpath));
                    var buttons = '<a ' +
                        'id="delete_hash_' + f.hash + '" ' +
                        'href="/admin/filemanager/adminfile/delete?file=' + fileBtoA + '" ' +
                        'class="btn btn-outline-light fa fa-trash"' +
                        '></a>' +
                        '<a href="' + fileUrl + '" target="_blank" class="btn btn-outline fa fa-eye"></a>';

                    var fileType = fileType[fileType.length - 1];
                    var icon = '<span class="badge badge-info" style="height:120px">.' + fileType + '</span>';
                    if (fileType.toLowerCase() === 'jpg' || fileType.toLowerCase() === 'png') {
                        icon = '<img class="lazy" alt="' + name + '" data-original="' + fileUrl + '?h=120" />';
                    }
                    if ($('#filemanager-target').length > 0) {
                        buttons += '<a href="#" class="btn btn-outline fa fa-paper-plane" data-file="' + f.path + '"></a>';
                    }

                    var file = '<div id="hash_' + f.hash + '" class="card mb-4">' +
                        '<div class="btn-group btn-group-sm">' +
                        buttons +
                        '</div>' +
                        '<div class="text-center p-3">' + icon + '</div>' +
                        '<div class="card-footer">' +
                        '<small>' + name + '</small>' +
                        '</div>' +
                        '</div>';
                    $(file).appendTo(fileList);
                });

                files = scannedFiles;
            }

            // Generate the breadcrumbs
            var url = removeParam('path', window.location.toString());
            url = removeParam('search', url);
            var breadcrumb = '<li class="breadcrumb-item">' +
                '<a class="fa fa-home" href="' + url + '"></a>' +
                '</li>';
            breadcrumbsUrls.forEach(function (u, i) {
                // Set hidden directory to current directory
                $('#directory').val(u);
                var name = u.split('/');
                if (i !== breadcrumbsUrls.length - 1 && u !== '') {
                    var newUrl = addParam('path', u, url);
                    breadcrumb += '<li class="breadcrumb-item">' +
                        '<a href="' + newUrl + '">' + name[name.length - 1] + '</a>' +
                        '</li>';
                } else if (u !== '') {
                    breadcrumb += '<li class="breadcrumb-item">' + name[name.length - 1] + '</li>';
                }
            });
            breadcrumbs.text('').append(breadcrumb);

            $('.fa-paper-plane').on('click', function (e) {
                e.preventDefault();
                $('#' + $('#filemanager-target').html(), window.parent.document).val($(this).data('file'));
                $('#container-filemanager', window.parent.document).slideUp();
                $('.note-toolbar', window.parent.document).show();
            });

            doSearch($('#search').val());

            ui.fadeIn('.filemanager .card-deck');
            if (typeof $.fn.lazyload !== 'undefined') {
                $("img.lazy").lazyload({effect: "fadeIn"});
            }
            ui.addDeleteConfirm();
        }
    });
});


function uploadFile() {
    var input = document.getElementById("file");
    var directory = document.getElementById("directory").value;
    var baseUri = window.location.protocol + "//" + window.location.hostname;

    var file = input.files[0];
    if (file !== undefined) {
        formData = new FormData();
        if (!!file.type.match(/image.*/)) {
            formData.append("image", file);
            formData.append("directory", directory);
            $.ajax({
                url: baseUri + "/filemanager/index/upload/",
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                success: function (data) {
                    var newLocation = "/filemanager/index?embedded=1&search=" + file.name;
                    var targetElement = $('#filemanager-target');
                    if (targetElement.length) {
                        newLocation += "&target=" + targetElement.html();
                    }
                    if (directory !== "") {
                        newLocation += "&path=" + directory;
                    }
                    window.location = baseUri + newLocation;
                }
            });
        } else {
            alert('Not a valid image!');
        }
    } else {
        alert('Input something!');
    }
}
