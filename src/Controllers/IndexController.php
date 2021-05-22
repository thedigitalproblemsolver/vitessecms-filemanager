<?php declare(strict_types=1);

namespace VitesseCms\Filemanager\Controllers;

use VitesseCms\Core\AbstractController;
use VitesseCms\Core\Utils\DirectoryUtil;
use VitesseCms\Core\Utils\FileUtil;
use VitesseCms\Media\Enums\AssetsEnum;

class IndexController extends AbstractController
{
    public function indexAction(): void
    {
        $this->assets->load(AssetsEnum::FILEMANAGER);
        $this->assets->loadLazyLoading();

        $target = '';
        if ($this->request->get('target')) :
            $target = str_replace('btn_', '', $this->request->get('target'));
        endif;

        $this->view->set('content', $this->view->renderTemplate(
            'adminFilemanager',
            $this->configuration->getVendorNameDir() . 'filemanager/src/Resources/views/',
            ['target' => $target]
        ));

        $this->prepareView();
    }

    public function scanAction(): void
    {
        if ($this->request->isAjax()) :
            header('Content-type: application/json');
            echo json_encode(
                [
                    'name' => '',
                    'type' => 'folder',
                    'path' => '',
                    'items' => $this->scan($this->configuration->getUploadDir()),
                ]
            );
        endif;

        $this->view->disable();
    }

    protected function scan(string $dir): array
    {
        $children = DirectoryUtil::getMixedList($dir);
        $files = [];

        foreach ($children as $filename => $fullPath) :
            if (is_dir($fullPath)) :
                $files[] = [
                    'name' => $filename,
                    'type' => 'folder',
                    'path' => str_replace(
                        $this->configuration->getWebDir() . 'uploads/' . $this->configuration->getAccount(),
                        '',
                        $fullPath
                    ),
                    'items' => $this->scan($fullPath),
                    'hash' => md5($fullPath),
                ];
            else :
                $files[] = [
                    'name' => $filename,
                    'type' => 'file',
                    'path' => str_replace(
                        $this->configuration->getWebDir() . 'uploads/' . $this->configuration->getAccount() . '/',
                        '',
                        $fullPath
                    ),
                    'thumbpath' => str_replace(
                        $this->configuration->getWebDir() . 'uploads/',
                        '',
                        $fullPath
                    ),
                    'size' => FileUtil::getSize($fullPath),
                    'hash' => md5($fullPath),
                ];
            endif;
        endforeach;

        return $files;
    }

    public function uploadAction(): void
    {
        $returnPath = '';
        if ($this->request->isAjax() && $this->request->hasFiles()) :
            foreach ($this->request->getUploadedFiles() as $file) :
                $name = FileUtil::sanatize($file->getName());
                $parent = $this->request->getPost('directory');
                if (!empty($parent)) :
                    $parent .= '/';
                endif;
                if ($file->moveTo($this->configuration->getUploadDir() . $parent . $name)) :
                    $this->flash->setSucces('ADMIN_FILE_UPLOAD_SUCCESS', [$file->getName()]);
                else :
                    $this->flash->setError('ADMIN_FILE_UPLOAD_FAILED', [$file->getName()]);
                endif;
            endforeach;
        endif;

        $this->redirect('/filemanager/index' . $returnPath);
    }
}
