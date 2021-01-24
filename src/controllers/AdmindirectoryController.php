<?php declare(strict_types=1);

namespace VitesseCms\Filemanager\Controllers;

use VitesseCms\Admin\AbstractAdminController;
use VitesseCms\Database\AbstractCollection;
use VitesseCms\Filemanager\Forms\AddDirectoryForm;
use VitesseCms\Form\AbstractForm;
use Phalcon\Filter;

class AdmindirectoryController extends AbstractAdminController
{
    public function createformAction(): void
    {
        $this->view->set('content',(new AddDirectoryForm())
            ->build($this->request->get('parent',Filter::FILTER_STRING))
            ->renderForm('admin/filemanager/admindirectory/parsecreateform')
        );

        $this->prepareView();
    }

    public function parseCreateFormAction(?string $itemId = null, AbstractCollection $item = null, AbstractForm $form = null): void
    {
        $parent = $this->request->getPost(
            'parent',
            [Filter::FILTER_STRING, Filter::FILTER_TRIM, Filter::FILTER_STRIPTAGS]
        );
        $newDirectory = $this->request->getPost(
            'directoryname',
            [Filter::FILTER_STRING, Filter::FILTER_TRIM, Filter::FILTER_STRIPTAGS, Filter::FILTER_URL]
        );
        if (!empty($parent)):
            $returnPath = '?path='.$parent.'/'.$newDirectory;
            $parent = ltrim($parent,'/').'/';
        else :
            $returnPath = '?path=/'.$newDirectory;
            $parent = '/';
        endif;

        $newDir = $this->configuration->getUploadDir().$parent.$newDirectory;

        if (!is_dir($newDir)):
            if (!mkdir($newDir) && !is_dir($newDir)) :
                $this->flash->setError('Directory creation failed');
            else :
                $this->flash->setSucces('Directory created');
            endif;
        else:
            $this->flash->setNotice('Directory already exists');
        endif;

        $this->redirect('filemanager/index'.$returnPath);
    }

    public function deleteAction() : void
    {
        $path = base64_decode($this->request->get('path'));
        $directoryToRemove = $this->configuration->getUploadDir(). $path;
        $returnPath = '';
        if( is_dir($directoryToRemove) && rmdir($directoryToRemove)) :
            $path = array_reverse(explode('/',$path));
            unset($path[0]);
            $returnPath = '?path='.implode('/', array_reverse($path));
        endif;
        $this->redirect('/filemanager/index'.$returnPath);
    }
}
