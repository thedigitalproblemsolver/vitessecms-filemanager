<?php declare(strict_types=1);

namespace VitesseCms\Filemanager;

use VitesseCms\Core\AbstractModule;
use Phalcon\DiInterface;

class Module extends AbstractModule
{
    public function registerServices(DiInterface $di, string $string = null)
    {
        parent::registerServices($di, 'Filemanager');
    }
}
