<?php declare(strict_types=1);

namespace VitesseCms\Filemanager\Controllers;

use VitesseCms\Admin\AbstractAdminController;

class AdminfileController extends AbstractAdminController
{
    public function deleteAction(): void
    {
        $file = base64_decode($this->request->get('file'));
        $fileToRemove = $this->configuration->getUploadBaseDir().$file;

        if (is_file($fileToRemove) && unlink($fileToRemove)) :
            $this->flash->setSucces('File deleted');
        else :
            $this->flash->setError('Deletion of file failed');
        endif;

        $path = explode('/', $file);
        unset($path[0]);
        $path = array_reverse($path);
        unset($path[0]);
        $returnPath = '?path='.implode('/', array_reverse($path));

        $this->redirect('/filemanager/index'.$returnPath);
    }
}
